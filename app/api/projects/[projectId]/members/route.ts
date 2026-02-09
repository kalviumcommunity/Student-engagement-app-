import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import dbConnect, { Role, LeanProject, LeanProjectMember, LeanUser } from "@/lib/db";
import { Project, ProjectMember, User } from "@/lib/models";

// ============================================
// GET /api/projects/[projectId]/members
// ============================================
export async function GET(
    request: Request,
    props: { params: Promise<{ projectId: string }> }
) {
    try {
        const userId = request.headers.get("x-user-id");
        const userRole = request.headers.get("x-user-role");

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const params = await props.params;
        const projectId = params.projectId;

        await dbConnect();

        const project = await Project.findById(projectId).lean() as unknown as LeanProject;
        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        if (userRole === Role.MENTOR) {
            if (project.mentorId.toString() !== userId) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        }

        const memberDocs = await ProjectMember.find({ projectId }).populate('userId').lean() as unknown as (LeanProjectMember & { userId: LeanUser })[];

        const members = memberDocs.map(m => ({
            id: m._id.toString(),
            userId: m.userId._id.toString(),
            name: m.userId.name,
            email: m.userId.email,
            role: m.userId.role,
            joinedAt: m.joinedAt,
        }));

        return NextResponse.json(members, { status: 200 });
    } catch (err) {
        console.error("Error fetching members:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ============================================
// POST /api/projects/[projectId]/members
// ============================================
export async function POST(
    request: Request,
    props: { params: Promise<{ projectId: string }> }
) {
    try {
        const userId = request.headers.get("x-user-id");
        const userRole = request.headers.get("x-user-role");

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (userRole !== Role.MENTOR) {
            return NextResponse.json({ error: "Only mentors can add members" }, { status: 403 });
        }

        const params = await props.params;
        const projectId = params.projectId;

        await dbConnect();

        const project = await Project.findById(projectId).lean() as unknown as LeanProject;
        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        if (project.mentorId.toString() !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const userToAdd = await User.findOne({ email }).lean() as unknown as LeanUser;
        if (!userToAdd) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const existingMember = await ProjectMember.findOne({
            projectId: projectId,
            userId: userToAdd._id,
        });

        if (existingMember) {
            return NextResponse.json({ error: "User is already a member" }, { status: 400 });
        }

        const newMember = await ProjectMember.create({
            projectId: projectId,
            userId: userToAdd._id,
        });

        return NextResponse.json({
            id: newMember._id.toString(),
            userId: userToAdd._id.toString(),
            name: userToAdd.name,
            message: "Member added successfully",
        }, { status: 201 });

    } catch (err) {
        console.error("Error adding member:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
