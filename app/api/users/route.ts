import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/db";

/**
 * GET /api/users
 * Returns all users in the system
 * For mentors: Returns all students (to add to projects)
 * For students: Returns all users (for peer feedback)
 */
export async function GET(request: Request) {
    try {
        // Authentication
        const userId = request.headers.get("x-user-id");
        const userRole = request.headers.get("x-user-role");

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized: Missing authentication" },
                { status: 401 }
            );
        }

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const roleFilter = searchParams.get("role"); // Optional: filter by role

        // Build query
        const where: any = {};

        // If role filter is provided, use it
        if (roleFilter && (roleFilter === "STUDENT" || roleFilter === "MENTOR")) {
            where.role = roleFilter;
        }

        // Fetch users
        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
            orderBy: {
                name: "asc",
            },
        });

        return NextResponse.json(users, { status: 200 });

    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
