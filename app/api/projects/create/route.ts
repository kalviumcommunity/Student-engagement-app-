import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import dbConnect, { Role, LeanProject } from "@/lib/db";
import { Project, ProjectMember } from "@/lib/models";
import mongoose from "mongoose";

// ============================================
// POST /api/projects/create
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
                projectId: result._id.toString(),
                title: result.title,
                message: "Project created successfully!",
                createdAt: result.createdAt,
            },
            { status: 201 }
        );

    } catch (err) {
        console.error("Error in /api/projects/create:", err);
        const errorMessage = err instanceof Error ? err.message : "Internal server error";
        return NextResponse.json(
            {
                error: "Internal server error",
                details: errorMessage,
            },
            { status: 500 }
        );
    }
}
