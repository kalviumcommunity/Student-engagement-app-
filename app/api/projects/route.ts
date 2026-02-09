import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import dbConnect, { Role, LeanProject, LeanProjectMember } from "@/lib/db";
import { Project, ProjectMember } from "@/lib/models";
import mongoose from "mongoose";

// ============================================
// GET /api/projects
// ============================================
export async function GET(request: Request) {
    try {
        const userId = request.headers.get("x-user-id");
        const userRole = request.headers.get("x-user-role");

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized: You must be logged in" },
                { status: 401 }
            );
        }

        await dbConnect();
        let projects;

        if (userRole === Role.MENTOR) {
            const projectDocs = await Project.find({ mentorId: userId }).sort({ createdAt: -1 }).lean() as unknown as LeanProject[];
            projects = projectDocs.map((p) => ({
                id: p._id.toString(),
                title: p.title,
                mentorId: p.mentorId.toString(),
                createdAt: p.createdAt,
                updatedAt: p.updatedAt,
            }));

        } else if (userRole === Role.STUDENT) {
            const projectMemberships = await ProjectMember.find({ userId: userId }).populate('projectId').lean() as unknown as (LeanProjectMember & { projectId: LeanProject })[];

            projects = projectMemberships
                .filter((m) => m.projectId)
                .map((m) => ({
                    id: m.projectId._id.toString(),
                    title: m.projectId.title,
                    mentorId: m.projectId.mentorId.toString(),
                    createdAt: m.projectId.createdAt,
                    updatedAt: m.projectId.updatedAt,
                }));

        } else {
            return NextResponse.json(
                { error: "Forbidden: Invalid role" },
                { status: 403 }
            );
        }

        return NextResponse.json(projects, { status: 200 });

    } catch (err) {
        console.error("Error in projects API:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// ============================================
// POST /api/projects
// ============================================
export async function POST(request: Request) {
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
                { error: "Only mentors can create projects" },
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

        const trimmedTitle = title.trim();
        await dbConnect();

        const session = await mongoose.startSession();
        let result;

        try {
            session.startTransaction();

            const projectBatch = await Project.create([{
                title: trimmedTitle,
                mentorId: userId,
            }], { session });

            result = projectBatch[0] as unknown as LeanProject;

            await ProjectMember.create([{
                userId: userId,
                projectId: result._id,
            }], { session });

            await session.commitTransaction();
        } catch (txnError) {
            await session.abortTransaction();
            throw txnError;
        } finally {
            session.endSession();
        }

        return NextResponse.json(
            {
                id: result._id.toString(),
                title: result.title,
                mentorId: result.mentorId.toString(),
                createdAt: result.createdAt,
            },
            { status: 201 }
        );
    } catch (err) {
        console.error("Error creating project:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
