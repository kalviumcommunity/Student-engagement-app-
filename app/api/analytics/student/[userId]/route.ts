import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
    request: Request,
    props: { params: Promise<{ userId: string }> }
) {
    try {
        // 1. Extract userId from URL params (Next.js 15: params is a Promise)
        const params = await props.params;
        const userId = params.userId;

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

        // 3. Validation: Verify target user exists and is a STUDENT
        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, role: true, name: true },
        });

        if (!targetUser) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        if (targetUser.role !== "STUDENT") {
            return NextResponse.json(
                { error: "Analytics are only available for students" },
                { status: 404 }
            );
        }

        // 4. Authorization: Role-based access control
        let hasAccess = false;

        if (loggedInUserRole === "STUDENT") {
            // Students can only view their own analytics
            hasAccess = userId === loggedInUserId;
        } else if (loggedInUserRole === "MENTOR") {
            // Mentors can view analytics for students in their projects
            // Check if the student is a member of any project owned by this mentor
            const sharedProject = await prisma.projectMember.findFirst({
                where: {
                    userId: userId,
                    project: {
                        mentorId: loggedInUserId,
                    },
                },
            });
            hasAccess = !!sharedProject;
        }

        if (!hasAccess) {
            return NextResponse.json(
                { error: "Forbidden: You do not have access to this student's analytics" },
                { status: 403 }
            );
        }

        // 5. Calculate Analytics (using Promise.all for parallel execution)

        // Calculate 7 days ago for recent activity
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        // Run all analytics queries in parallel for better performance
        const [
            totalTasksAssigned,
            completedTasks,
            inProgressTasks,
            feedbackAggregation,
            totalEngagementLogs,
            recentActivityCount,
        ] = await Promise.all([
            // Task Analytics
            prisma.task.count({
                where: { assignedToId: userId },
            }),
            prisma.task.count({
                where: { assignedToId: userId, status: "DONE" },
            }),
            prisma.task.count({
                where: { assignedToId: userId, status: "IN_PROGRESS" },
            }),

            // Feedback Analytics
            prisma.peerFeedback.aggregate({
                where: { toUserId: userId },
                _count: true,
                _avg: { rating: true },
            }),

            // Engagement Analytics
            prisma.engagementLog.count({
                where: { userId: userId },
            }),
            // Count engagement logs in the last 7 days
            prisma.engagementLog.count({
                where: {
                    userId: userId,
                    createdAt: { gte: sevenDaysAgo },
                },
            }),
        ]);

        // 6. Calculate derived metrics with edge case handling

        // Completion percentage: handle division by zero and clamp to 100
        const completionPercentage =
            totalTasksAssigned === 0
                ? 0
                : Math.min(100, Math.round((completedTasks / totalTasksAssigned) * 1000) / 10);

        // Average rating: handle null, round to 1 decimal, clamp to max 5.0
        const averageRating = feedbackAggregation._avg.rating
            ? Math.min(5.0, Math.round(feedbackAggregation._avg.rating * 10) / 10)
            : 0;

        // 7. Return structured response
        return NextResponse.json(
            {
                userId: userId,
                taskStats: {
                    total: totalTasksAssigned,
                    completed: completedTasks,
                    inProgress: inProgressTasks,
                    completionPercentage: completionPercentage,
                },
                feedbackStats: {
                    totalFeedback: feedbackAggregation._count,
                    averageRating: averageRating,
                },
                engagementStats: {
                    totalActivities: totalEngagementLogs,
                    recentActivities: recentActivityCount,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching student analytics:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
