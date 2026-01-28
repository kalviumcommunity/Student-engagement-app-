import { NextResponse } from "next/server";
import { prisma, ActionType, logEngagement, Role } from "@/lib/db";

// ============================================
// GET /api/feedback
// ============================================
// Fetches feedback based on the logged-in user's role:
// - STUDENT: Returns feedback they received (toUserId = their user ID)
// - MENTOR: Returns all feedback from their projects (project.mentorId = their user ID)

export async function GET(request: Request) {
    try {
        // STEP 1: Read Authentication Headers
        // ====================================
        const userId = request.headers.get("x-user-id");
        const userRole = request.headers.get("x-user-role");

        // STEP 2: Authentication Check
        // =============================
        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized: You must be logged in" },
                { status: 401 }
            );
        }

        // STEP 3: Fetch Feedback Based on Role
        // =====================================
        let feedback;

        if (userRole === Role.STUDENT) {
            // STUDENT QUERY
            // =============
            // Students see ONLY feedback they received
            // This is their peer evaluation/ratings

            feedback = await prisma.peerFeedback.findMany({
                where: {
                    toUserId: userId, // Only feedback received by this student
                },
                select: {
                    id: true,
                    fromUserId: true,
                    toUserId: true,
                    projectId: true,
                    rating: true,
                    comment: true,
                    createdAt: true,
                },
                orderBy: {
                    createdAt: "desc", // Newest feedback first
                },
            });

        } else if (userRole === Role.MENTOR) {
            // MENTOR QUERY
            // ============
            // Mentors see ALL feedback from their projects
            // This helps them monitor team dynamics and performance
            // We need to:
            // 1. Find all projects where mentorId = logged-in user
            // 2. Get all feedback from those projects

            feedback = await prisma.peerFeedback.findMany({
                where: {
                    project: {
                        mentorId: userId, // Filter by project's mentor
                    },
                },
                select: {
                    id: true,
                    fromUserId: true,
                    toUserId: true,
                    projectId: true,
                    rating: true,
                    comment: true,
                    createdAt: true,
                },
                orderBy: {
                    createdAt: "desc", // Newest feedback first
                },
            });

        } else {
            // INVALID ROLE
            // ============
            return NextResponse.json(
                { error: "Invalid user role" },
                { status: 403 }
            );
        }

        // STEP 4: Return Feedback
        // ========================
        // Return the array of feedback
        // If no feedback found, this will be an empty array []
        // That's perfectly valid - not an error!

        return NextResponse.json(feedback, { status: 200 });

    } catch (error) {
        // STEP 5: Error Handling
        // =======================
        console.error("Error fetching feedback:", error);

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}


// ============================================
// POST /api/feedback
// ============================================
// Creates peer feedback for a project member
// Both users must be members of the project
// Users cannot give feedback to themselves

interface CreateFeedbackBody {
    projectId: string;
    toUserId: string;
    rating: number;
    comment?: string;
}

export async function POST(request: Request) {
    try {
        // STEP 1: Read Authentication Headers
        // ====================================
        const userId = request.headers.get("x-user-id");
        const userRole = request.headers.get("x-user-role");

        // STEP 2: Authentication Check
        // =============================
        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized: You must be logged in" },
                { status: 401 }
            );
        }

        // STEP 3: Parse Request Body
        // ===========================
        let body: CreateFeedbackBody;
        try {
            body = await request.json();
        } catch (e) {
            return NextResponse.json(
                { error: "Invalid JSON body" },
                { status: 400 }
            );
        }

        const { projectId, toUserId, rating, comment } = body;

        // STEP 4: Input Validation
        // =========================
        // Check that all required fields are present
        if (!projectId || !toUserId || rating === undefined || rating === null) {
            return NextResponse.json(
                { error: "projectId, toUserId, and rating are required" },
                { status: 400 }
            );
        }

        // STEP 5: Validate Rating Range
        // ==============================
        // Rating must be between 1 and 5 (inclusive)
        if (typeof rating !== 'number' || rating < 1 || rating > 5) {
            return NextResponse.json(
                { error: "Rating must be a number between 1 and 5" },
                { status: 400 }
            );
        }

        // STEP 6: Prevent Self-Feedback
        // ==============================
        // Users cannot give feedback to themselves
        // This ensures fair and meaningful peer evaluation
        if (userId === toUserId) {
            return NextResponse.json(
                { error: "You cannot give feedback to yourself" },
                { status: 400 }
            );
        }

        // STEP 7: Verify Project Exists
        // ==============================
        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        // STEP 8: Verify Recipient User Exists
        // =====================================
        const recipientUser = await prisma.user.findUnique({
            where: { id: toUserId },
        });

        if (!recipientUser) {
            return NextResponse.json(
                { error: "Recipient user not found" },
                { status: 404 }
            );
        }

        // STEP 9: Verify Both Users are Project Members
        // ==============================================
        // CRITICAL SECURITY CHECK
        // Both the person giving feedback AND receiving feedback
        // must be members of the project

        // Check if the logged-in user (feedback giver) is a member
        const giverMembership = await prisma.projectMember.findFirst({
            where: {
                projectId: projectId,
                userId: userId,
            },
        });

        if (!giverMembership) {
            return NextResponse.json(
                { error: "You are not a member of this project" },
                { status: 403 }
            );
        }

        // Check if the recipient is a member
        const recipientMembership = await prisma.projectMember.findFirst({
            where: {
                projectId: projectId,
                userId: toUserId,
            },
        });

        if (!recipientMembership) {
            return NextResponse.json(
                {
                    error: `${recipientUser.name} is not a member of this project`
                },
                { status: 403 }
            );
        }

        // STEP 10: Create Peer Feedback
        // ==============================
        // All validations passed - create the feedback record
        const feedback = await prisma.peerFeedback.create({
            data: {
                fromUserId: userId,
                toUserId: toUserId,
                projectId: projectId,
                rating: rating,
                comment: comment || "", // Use empty string if no comment provided
            },
        });

        // STEP 11: Log Engagement
        // ========================
        // Track that the user gave feedback
        await logEngagement(
            userId,
            ActionType.FEEDBACK,
            `Gave feedback to ${recipientUser.name} in project ${project.title}`
        );

        // STEP 12: Return Success Response
        // =================================
        return NextResponse.json(
            {
                id: feedback.id,
                fromUserId: feedback.fromUserId,
                toUserId: feedback.toUserId,
                projectId: feedback.projectId,
                rating: feedback.rating,
                comment: feedback.comment,
                createdAt: feedback.createdAt,
            },
            { status: 201 }
        );

    } catch (error) {
        // STEP 13: Error Handling
        // ========================
        console.error("Error creating feedback:", error);

        // Check for Prisma foreign key constraint errors
        if (error instanceof Error && error.message.includes("Foreign key constraint")) {
            return NextResponse.json(
                { error: "Invalid projectId or userId reference" },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
