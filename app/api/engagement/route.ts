import { NextResponse } from "next/server";
import { prisma, ActionType } from "@/lib/db";

// ============================================
// POST /api/engagement
// ============================================
// Logs user engagement activities
// Authorization: Any authenticated user can log their own engagement

export async function POST(request: Request) {
    try {
        // STEP 1: Authentication
        // =====================
        const userId = request.headers.get("x-user-id");
        const userRole = request.headers.get("x-user-role");

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized: Missing authentication credentials" },
                { status: 401 }
            );
        }

        // STEP 2: Parse Request Body
        // ===========================
        const body = await request.json();
        const { projectId, actionType, details } = body;

        // STEP 3: Validate Required Fields
        // =================================
        if (!actionType) {
            return NextResponse.json(
                { error: "Missing required field: actionType" },
                { status: 400 }
            );
        }

        // STEP 4: Validate ActionType Enum
        // =================================
        const validActionTypes = Object.values(ActionType);
        if (!validActionTypes.includes(actionType)) {
            return NextResponse.json(
                {
                    error: `Invalid actionType. Must be one of: ${validActionTypes.join(", ")}`
                },
                { status: 400 }
            );
        }

        // STEP 5: Create Engagement Log
        // ==============================
        // Note: projectId is optional metadata, not used for authorization
        const engagementLog = await prisma.engagementLog.create({
            data: {
                userId: userId,
                actionType: actionType,
                details: details || null,
            },
        });

        // STEP 7: Return Success Response
        // ================================
        return NextResponse.json(
            {
                id: engagementLog.id,
                userId: engagementLog.userId,
                actionType: engagementLog.actionType,
                details: engagementLog.details,
                createdAt: engagementLog.createdAt,
            },
            { status: 201 }
        );

    } catch (error) {
        console.error("Error logging engagement:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
