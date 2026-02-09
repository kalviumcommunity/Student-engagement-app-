import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/db";

export async function GET(
    request: Request,
    props: { params: Promise<{ projectId: string }> }
) {
    try {
        // 1. Extract projectId from URL params (Next.js 15: params is a Promise)
        const params = await props.params;
        const projectId = params.projectId;

        // 2. Authentication: Read headers
        const loggedInUserId = request.headers.get("x-user-id");
        const loggedInUserRole = request.headers.get("x-user-role");

        // Check if user is authenticated
        if (!loggedInUserId) {
            return NextResponse.json(
                { error: "Unauthorized: Missing authentication credentials" },
                { status: 401 }
            );
        }

        // 3. Role-Based Authorization: Only MENTORS can view project analytics
        if (loggedInUserRole !== "MENTOR") {
            return NextResponse.json(
                { error: "Forbidden: Only mentors can view project analytics" },
                { status: 403 }
            );
        }

        // 4. Fetch Project and verify ownership
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { id: true, mentorId: true, title: true },
        });

        // Handle Project Not Found
        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        // Verify that the logged-in mentor owns this project
        if (project.mentorId !== loggedInUserId) {
            return NextResponse.json(
                { error: "Forbidden: You can only view analytics for your own projects" },
                { status: 403 }
            );
        }

        // 5. Calculate Analytics (using Promise.all for parallel execution)

        // Calculate 7 days ago for active members
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        // Run all analytics queries in parallel for better performance
        const [
            totalTasks,
            completedTasks,
            inProgressTasks,
            totalMembers,
            feedbackAggregation,
            projectMemberIds,
            recentEngagementUserIds,
        ] = await Promise.all([
            // Task Analytics
            prisma.task.count({
                where: { projectId: projectId },
            }),
            prisma.task.count({
                where: { projectId: projectId, status: "DONE" },
            }),
            prisma.task.count({
                where: { projectId: projectId, status: "IN_PROGRESS" },
            }),

            // Team Analytics: Total Members
            prisma.projectMember.count({
                where: { projectId: projectId },
            }),

            // Feedback Analytics
            prisma.peerFeedback.aggregate({
                where: { projectId: projectId },
                _count: true,
                _avg: { rating: true },
            }),

            // Get all member user IDs for this project
            prisma.projectMember.findMany({
                where: { projectId: projectId },
                select: { userId: true },
            }),

            // Get distinct user IDs with engagement in last 7 days
            prisma.engagementLog.findMany({
                where: {
                    createdAt: { gte: sevenDaysAgo },
                },
                select: { userId: true },
                distinct: ['userId'],
            }),
        ]);

        // 6. Calculate Active Members
        // Active members = users who are project members AND have engagement in last 7 days
        const memberUserIdSet = new Set(projectMemberIds.map(m => m.userId));
        const recentEngagementUserIdSet = new Set(recentEngagementUserIds.map(e => e.userId));

        // Count members who have recent engagement
        const activeMembers = projectMemberIds.filter(
            m => recentEngagementUserIdSet.has(m.userId)
        ).length;

        // 7. Calculate Derived Metrics with edge case handling

        // Completion percentage: handle division by zero and clamp to 100
        const completionPercentage =
            totalTasks === 0
                ? 0
                : Math.min(100, Math.round((completedTasks / totalTasks) * 1000) / 10);

        // Average rating: handle null, round to 1 decimal, clamp to max 5.0
        const averageRating = feedbackAggregation._avg.rating
            ? Math.min(5.0, Math.round(feedbackAggregation._avg.rating * 10) / 10)
            : 0;

        // 8. Return Structured Response
        return NextResponse.json(
            {
                projectId: projectId,
                taskStats: {
                    total: totalTasks,
                    completed: completedTasks,
                    inProgress: inProgressTasks,
                    completionPercentage: completionPercentage,
                },
                teamStats: {
                    totalMembers: totalMembers,
                    activeMembers: activeMembers,
                },
                feedbackStats: {
                    totalFeedback: feedbackAggregation._count,
                    averageRating: averageRating,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching project analytics:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
