import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/db";

export async function DELETE(
    request: Request,
    props: { params: Promise<{ projectId: string; userId: string }> }
) {
    try {
        // 1. Extract parameters from URL (Next.js 15: params is a Promise)
        const params = await props.params;
        const projectId = params.projectId;
        const userId = params.userId; // Member to remove

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

        // 3. Role-Based Authorization: Only MENTORS can remove members
        if (loggedInUserRole !== "MENTOR") {
            return NextResponse.json(
                { error: "Forbidden: Only mentors can remove project members" },
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
                { error: "Forbidden: You can only remove members from your own projects" },
                { status: 403 }
            );
        }

        // 5. Safety Check: Prevent mentor from removing themselves
        // This prevents accidental project orphaning
        if (userId === project.mentorId) {
            return NextResponse.json(
                { error: "Bad Request: Mentors cannot remove themselves from projects" },
                { status: 400 }
            );
        }

        // 6. Validate that the user is actually a member of this project
        const membership = await prisma.projectMember.findUnique({
            where: {
                userId_projectId: {
                    userId: userId,
                    projectId: projectId,
                },
            },
        });

        if (!membership) {
            return NextResponse.json(
                { error: "User is not a member of this project" },
                { status: 404 }
            );
        }

        // 7. Perform Database Operations in a Transaction
        // This ensures all operations succeed or fail together
        await prisma.$transaction(async (tx) => {
            // Step 1: Unassign all tasks assigned to this user in this project
            // We set assignedToId to null instead of deleting to preserve project history
            await tx.task.updateMany({
                where: {
                    projectId: projectId,
                    assignedToId: userId,
                },
                data: {
                    assignedToId: null,
                },
            });

            // Step 2: Delete the ProjectMember record
            await tx.projectMember.delete({
                where: {
                    userId_projectId: {
                        userId: userId,
                        projectId: projectId,
                    },
                },
            });

            // Step 3: Log the engagement activity
            await tx.engagementLog.create({
                data: {
                    userId: loggedInUserId, // The mentor who performed the action
                    actionType: "MEMBER_REMOVED",
                    details: `Removed member ${userId} from project ${projectId}`,
                },
            });
        });

        // 8. Return Success Response
        return NextResponse.json(
            { message: "Member removed successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error removing project member:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
