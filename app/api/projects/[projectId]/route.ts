import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import dbConnect, { Role, LeanProject } from "@/lib/db";
import { Project, ProjectMember, Task, PeerFeedback } from "@/lib/models";
import mongoose from "mongoose";

// ============================================
// GET /api/projects/[projectId]
// ============================================
// Fetches a single project's details with statistics
export async function GET(
    request: Request,
    props: { params: Promise<{ projectId: string }> }
) {
    try {
        const userId = request.headers.get("x-user-id");
        const userRole = request.headers.get("x-user-role");

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized: You must be logged in" },
                { status: 401 }
            );
        }

        const params = await props.params;
        const projectId = params.projectId;

        await dbConnect();

        const projectDoc = await Project.findById(projectId).lean() as unknown as LeanProject;

        if (!projectDoc) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        const project = { ...projectDoc, id: projectDoc._id.toString(), mentorId: projectDoc.mentorId.toString() };

        if (userRole === Role.MENTOR) {
            if (project.mentorId !== userId) {
                return NextResponse.json(
                    { error: "Access denied: You can only view your own projects" },
                    { status: 403 }
                );
            }
        } else if (userRole === Role.STUDENT) {
            const membership = await ProjectMember.findOne({
                projectId: projectId,
                userId: userId,
            });

            if (!membership) {
                return NextResponse.json(
                    { error: "Access denied: You are not a member of this project" },
                    { status: 403 }
                );
            }
        } else {
            return NextResponse.json(
                { error: "Invalid user role" },
                { status: 403 }
            );
        }

        const totalTasks = await Task.countDocuments({ projectId: projectId });
        const totalMembers = await ProjectMember.countDocuments({ projectId: projectId });

        return NextResponse.json(
            {
                id: project.id,
                title: project.title,
                mentorId: project.mentorId,
                createdAt: project.createdAt,
                updatedAt: project.updatedAt,
                totalTasks: totalTasks,
                totalMembers: totalMembers,
            },
            { status: 200 }
        );

    } catch (err) {
        console.error("Error fetching project:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// ============================================
// PUT /api/projects/[projectId]
// ============================================
export async function PUT(
    request: Request,
    props: { params: Promise<{ projectId: string }> }
) {
    try {
        const userId = request.headers.get("x-user-id");
        const userRole = request.headers.get("x-user-role");

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized: You must be logged in" },
                { status: 401 }
            );
        }

        if (userRole !== Role.MENTOR) {
            return NextResponse.json(
                { error: "Only mentors can update projects" },
                { status: 403 }
            );
        }

        const params = await props.params;
        const projectId = params.projectId;

        await dbConnect();
        const project = await Project.findById(projectId).lean() as unknown as LeanProject;

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        if (project.mentorId.toString() !== userId) {
            return NextResponse.json(
                { error: "Access denied: You can only update your own projects" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { title } = body;

        if (!title || title.trim() === "") {
            return NextResponse.json(
                { error: "Project title is required" },
                { status: 400 }
            );
        }

        const updatedProjectDoc = await Project.findByIdAndUpdate(
            projectId,
            { title: title.trim() },
            { new: true }
        ).lean() as unknown as LeanProject;

        if (!updatedProjectDoc) {
            return NextResponse.json(
                { error: "Failed to update project" },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                id: updatedProjectDoc._id.toString(),
                title: updatedProjectDoc.title,
                mentorId: updatedProjectDoc.mentorId.toString(),
                createdAt: updatedProjectDoc.createdAt,
                updatedAt: updatedProjectDoc.updatedAt,
            },
            { status: 200 }
        );

    } catch (err) {
        console.error("Error updating project:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// ============================================
// DELETE /api/projects/[projectId]
// ============================================
export async function DELETE(
    request: Request,
    props: { params: Promise<{ projectId: string }> }
) {
    try {
        const userId = request.headers.get("x-user-id");
        const userRole = request.headers.get("x-user-role");

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized: You must be logged in" },
                { status: 401 }
            );
        }

        if (userRole !== Role.MENTOR) {
            return NextResponse.json(
                { error: "Only mentors can delete projects" },
                { status: 403 }
            );
        }

        const params = await props.params;
        const projectId = params.projectId;

        await dbConnect();
        const project = await Project.findById(projectId).lean() as unknown as LeanProject;

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        if (project.mentorId.toString() !== userId) {
            return NextResponse.json(
                { error: "Access denied: You can only delete your own projects" },
                { status: 403 }
            );
        }

        const session = await mongoose.startSession();
        try {
            session.startTransaction();

            await ProjectMember.deleteMany({ projectId: projectId }, { session });
            await Task.deleteMany({ projectId: projectId }, { session });
            await PeerFeedback.deleteMany({ projectId: projectId }, { session });

            await Project.findByIdAndDelete(projectId, { session });

            await session.commitTransaction();
        } catch (txnError) {
            await session.abortTransaction();
            throw txnError;
        } finally {
            session.endSession();
        }

        return NextResponse.json(
            { message: "Project deleted successfully" },
            { status: 200 }
        );

    } catch (err) {
        console.error("Error deleting project:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
