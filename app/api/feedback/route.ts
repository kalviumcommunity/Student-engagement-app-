import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import dbConnect, { Role, LeanProject, LeanUser, LeanPeerFeedback } from "@/lib/db";
import { Project, PeerFeedback } from "@/lib/models";

// ============================================
// GET /api/feedback
// ============================================
export async function GET(request: Request) {
    try {
        const userId = request.headers.get("x-user-id");
        const userRole = request.headers.get("x-user-role");

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        let feedbackDocs;
        if (userRole === Role.MENTOR) {
            // Mentors see feedback for their projects
            const mentorProjects = await Project.find({ mentorId: userId }).lean() as unknown as LeanProject[];
            const projectIds = mentorProjects.map(p => p._id);
            feedbackDocs = await PeerFeedback.find({ projectId: { $in: projectIds } })
                .populate('reviewerId')
                .populate('revieweeId')
                .populate('projectId')
                .sort({ createdAt: -1 })
                .lean() as unknown as (LeanPeerFeedback & { reviewerId: LeanUser, revieweeId: LeanUser, projectId: LeanProject })[];
        } else if (userRole === Role.STUDENT) {
            // Students see feedback they gave or received
            feedbackDocs = await PeerFeedback.find({
                $or: [{ reviewerId: userId }, { revieweeId: userId }]
            })
                .populate('reviewerId')
                .populate('revieweeId')
                .populate('projectId')
                .sort({ createdAt: -1 })
                .lean() as unknown as (LeanPeerFeedback & { reviewerId: LeanUser, revieweeId: LeanUser, projectId: LeanProject })[];
        } else {
            return NextResponse.json({ error: "Invalid role" }, { status: 403 });
        }

        const feedback = feedbackDocs.map(f => {
            // Safety check for populated fields
            const proj = f.projectId as unknown as LeanProject;
            const reviewer = f.reviewerId as unknown as LeanUser;
            const reviewee = f.revieweeId as unknown as LeanUser;

            return {
                id: f._id.toString(),
                projectId: proj._id.toString(),
                projectTitle: proj.title,
                reviewerId: reviewer._id.toString(),
                reviewerName: reviewer.name,
                revieweeId: reviewee._id.toString(),
                revieweeName: reviewee.name,
                content: f.content,
                rating: f.rating,
                createdAt: f.createdAt,
            };
        });

        return NextResponse.json(feedback, { status: 200 });
    } catch (err) {
        console.error("Error fetching feedback:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ============================================
// POST /api/feedback
// ============================================
export async function POST(request: Request) {
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { projectId, revieweeId, content, rating } = body;

        if (!projectId || !revieweeId || !content || rating === undefined) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        await dbConnect();

        const feedback = await PeerFeedback.create({
            projectId,
            reviewerId: userId,
            revieweeId,
            content,
            rating
        });

        return NextResponse.json({
            id: feedback._id.toString(),
            message: "Feedback submitted successfully"
        }, { status: 201 });
    } catch (err) {
        console.error("Error submitting feedback:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
