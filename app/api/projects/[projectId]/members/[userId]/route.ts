import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import dbConnect from "@/lib/db";
import { Project, ProjectMember, Task, EngagementLog } from "@/lib/models";
import mongoose from "mongoose";

interface LeanProject {
    _id: mongoose.Types.ObjectId;
    title: string;
    mentorId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

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

        // Connect to database
        await dbConnect();

        // 4. Fetch Project and verify ownership
        const projectDoc = await Project.findById(projectId).lean() as unknown as LeanProject;

        // Handle Project Not Found
        if (!projectDoc) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        const project = { ...projectDoc, id: projectDoc._id.toString(), mentorId: projectDoc.mentorId.toString() };
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
        const membership = await ProjectMember.findOne({
            userId: userId,
            projectId: projectId,
        });
        if (!membership) {
            return NextResponse.json(
                { error: "User is not a member of this project" },
                { status: 404 }
            );
        }

        // 7. Perform Database Operations
        const session = await mongoose.startSession();
        try {
            session.startTransaction();

            // Step 1: Unassign all tasks
            await Task.updateMany(
                { projectId: projectId, assignedToId: userId },
                { assignedToId: null },
                { session }
            );

            // Step 2: Delete the ProjectMember record
            await ProjectMember.deleteOne({ userId, projectId }, { session });

            // Step 3: Log the engagement activity
            await EngagementLog.create([{
                userId: loggedInUserId,
                actionType: "MEMBER_REMOVED",
                details: `Removed member ${userId} from project ${projectId}`,
            }], { session });

            await session.commitTransaction();
        } catch (txnError) {
            await session.abortTransaction();
            throw txnError;
        } finally {
            session.endSession();
        }
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
