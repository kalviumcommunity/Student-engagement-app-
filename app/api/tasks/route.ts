import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import dbConnect, { Role, ActionType, logEngagement, LeanTask, LeanProject, LeanUser } from "@/lib/db";
import { Task, Project, User, ProjectMember } from "@/lib/models";

// ============================================
// GET /api/tasks
// ============================================
export async function GET(request: Request) {
    try {
        const userId = request.headers.get("x-user-id");
        const userRole = request.headers.get("x-user-role");

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get("projectId");

        await dbConnect();

        let tasks;
        if (userRole === Role.MENTOR) {
            if (!projectId) {
                return NextResponse.json({ error: "projectId is required" }, { status: 400 });
            }
            const taskDocs = await Task.find({ projectId }).sort({ createdAt: -1 }).lean() as unknown as LeanTask[];
            tasks = taskDocs.map(t => ({
                id: t._id.toString(),
                title: t.title,
                status: t.status,
                projectId: t.projectId.toString(),
                assignedToId: t.assignedToId ? t.assignedToId.toString() : null,
                createdAt: t.createdAt,
                updatedAt: t.updatedAt,
            }));
        } else if (userRole === Role.STUDENT) {
            const taskDocs = await Task.find({ assignedToId: userId }).sort({ createdAt: -1 }).lean() as unknown as LeanTask[];
            tasks = taskDocs.map(t => ({
                id: t._id.toString(),
                title: t.title,
                status: t.status,
                projectId: t.projectId.toString(),
                assignedToId: t.assignedToId ? t.assignedToId.toString() : null,
                createdAt: t.createdAt,
                updatedAt: t.updatedAt,
            }));
        } else {
            return NextResponse.json({ error: "Invalid role" }, { status: 403 });
        }

        return NextResponse.json(tasks, { status: 200 });
    } catch (err) {
        console.error("Error fetching tasks:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ============================================
// POST /api/tasks
// ============================================
export async function POST(request: Request) {
    try {
        const userId = request.headers.get("x-user-id");
        const userRole = request.headers.get("x-user-role");

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (userRole !== Role.MENTOR) {
            return NextResponse.json({ error: "Only mentors can create tasks" }, { status: 403 });
        }

        const body = await request.json();
        const { title, projectId, assignedToId } = body;

        if (!title || !projectId || !assignedToId) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        await dbConnect();

        const project = await Project.findById(projectId).lean() as unknown as LeanProject;
        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const assignedUser = await User.findById(assignedToId).lean() as unknown as LeanUser;
        if (!assignedUser) {
            return NextResponse.json({ error: "Assigned user not found" }, { status: 404 });
        }

        const isMember = await ProjectMember.findOne({ projectId, userId: assignedToId });
        if (!isMember) {
            return NextResponse.json({ error: "User is not a member" }, { status: 400 });
        }

        const task = await Task.create({
            title,
            projectId,
            assignedToId,
            status: "TODO"
        });

        await logEngagement(userId, ActionType.TASK_UPDATE, `Created task: ${title}`);

        return NextResponse.json(
            {
                id: task._id.toString(),
                title: task.title,
                status: task.status,
                projectId: task.projectId.toString(),
                assignedToId: task.assignedToId.toString(),
                createdAt: (task as unknown as LeanTask).createdAt,
            },
            { status: 201 }
        );
    } catch (err) {
        console.error("Error creating task:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
