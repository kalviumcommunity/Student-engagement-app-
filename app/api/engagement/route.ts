import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import dbConnect, { ActionType, logEngagement } from "@/lib/db";

// ============================================
// POST /api/engagement
// ============================================
// Logs a student engagement action
// Used by the frontend to track things like 'VIEW_DASHBOARD', 'CLICK_TASK', etc.
export async function POST(request: Request) {
    try {
        // STEP 1: Authentication Check
        // =============================
        const userId = request.headers.get("x-user-id");
        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized: Missing user ID" },
                { status: 401 }
            );
        }

        // STEP 2: Parse and Validate Request Body
        // ========================================
        const body = await request.json();
        const { actionType, details } = body;

        // Ensure actionType is a valid ActionType enum value
        if (!Object.values(ActionType).includes(actionType as ActionType)) {
            return NextResponse.json(
                { error: "Invalid action type" },
                { status: 400 }
            );
        }

        // STEP 3: Connect to Database
        // ===========================
        await dbConnect();

        // STEP 4: Log the Engagement
        // ==========================
        // We use the helper function from lib/db.ts to ensure consistency
        const log = await logEngagement(
            userId,
            actionType as ActionType,
            details || ""
        );

        // STEP 5: Return Success
        // ======================
        return NextResponse.json(
            {
                success: true,
                logId: log._id.toString(),
                action: actionType,
            },
            { status: 201 }
        );

    } catch (err) {
        // STEP 6: Error Handling
        // =======================
        console.error("Error logging engagement:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
