import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import dbConnect, { LeanUser, LeanTask, LeanEngagementLog, LeanProjectMember, LeanProject } from "@/lib/db";
import { User, Task, ProjectMember, EngagementLog } from "@/lib/models";

export async function GET(
    request: Request,
    props: { params: Promise<{ userId: string }> }
) {
    try {
        const loggedInUserId = request.headers.get("x-user-id");

        if (!loggedInUserId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const params = await props.params;
        const targetUserId = params.userId;

        await dbConnect();

        const user = await User.findById(targetUserId).lean() as unknown as LeanUser;
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const taskDocs = await Task.find({ assignedToId: targetUserId }).lean() as unknown as LeanTask[];
        const engagementDocs = await EngagementLog.find({ userId: targetUserId }).sort({ timestamp: -1 }).limit(10).lean() as unknown as LeanEngagementLog[];
        const memberships = await ProjectMember.find({ userId: targetUserId }).populate('projectId').lean() as unknown as (LeanProjectMember & { projectId: LeanProject })[];

        const totalTasks = taskDocs.length;
        const completedTasks = taskDocs.filter(t => t.status === "DONE").length;

        return NextResponse.json({
            userId: targetUserId,
            userName: user.name,
            statistics: {
                totalTasks,
                completedTasks,
                completionPercentage: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
                totalProjects: memberships.length,
            },
            recentEngagement: engagementDocs.map(e => ({
                id: e._id.toString(),
                type: e.actionType,
                details: e.details,
                timestamp: e.timestamp,
            })),
            projects: memberships.map(m => ({
                id: m.projectId._id.toString(),
                title: m.projectId.title,
            }))
        }, { status: 200 });

    } catch (err) {
        console.error("Error in student analytics:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
