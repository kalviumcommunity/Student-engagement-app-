import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import dbConnect, { LeanProject, LeanTask, LeanProjectMember } from "@/lib/db";
import { Project, Task, ProjectMember } from "@/lib/models";

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

        if (userRole === "MENTOR") {
            if (project.mentorId.toString() !== userId) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        } else {
            const membership = await ProjectMember.findOne({ projectId, userId }).lean();
            if (!membership) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        }

        const tasksCount = await Task.countDocuments({ projectId });
        const completedTasksCount = await Task.countDocuments({ projectId, status: "DONE" });
        const membersCount = await ProjectMember.countDocuments({ projectId });

        const tasks = await Task.find({ projectId }).lean() as unknown as LeanTask[];
        const membersDocs = await ProjectMember.find({ projectId }).populate('userId').lean() as unknown as (LeanProjectMember & { userId: { name: string, id: string } })[];

        const statusDistribution = {
            todo: tasks.filter(t => t.status === "TODO").length,
            inProgress: tasks.filter(t => t.status === "IN_PROGRESS").length,
            done: tasks.filter(t => t.status === "DONE").length,
        };

        return NextResponse.json({
            projectId,
            projectTitle: project.title,
            statistics: {
                totalTasks: tasksCount,
                completedTasks: completedTasksCount,
                totalMembers: membersCount,
                completionPercentage: tasksCount > 0 ? (completedTasksCount / tasksCount) * 100 : 0,
            },
            statusDistribution,
            recentActivity: tasks.slice(0, 5).map(t => ({
                id: t._id.toString(),
                action: "Task Updated",
                details: t.title,
                timestamp: t.updatedAt,
            })),
            members: membersDocs.map(m => ({
                userId: m.userId.id,
                name: m.userId.name,
                role: "STUDENT",
            }))
        }, { status: 200 });

    } catch (err) {
        console.error("Error in project analytics:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
