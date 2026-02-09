import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import dbConnect, { LeanUser } from "@/lib/db";
import { User } from "@/lib/models";

/**
 * GET /api/users
 * Returns all users in the system
 * For mentors: Returns all students (to add to projects)
 * For students: Returns all users (for peer feedback)
 */
export async function GET(request: Request) {
    try {
        const userId = request.headers.get("x-user-id");

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized: Missing authentication" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const roleFilter = searchParams.get("role");

        await dbConnect();

        const query: { role?: string } = {};
        if (roleFilter && (roleFilter === "STUDENT" || roleFilter === "MENTOR")) {
            query.role = roleFilter;
        }

        const userDocs = await User.find(query)
            .select('name email role createdAt')
            .sort({ name: 1 })
            .lean() as LeanUser[];

        const users = userDocs.map((u: LeanUser) => ({
            id: u._id.toString(),
            name: u.name,
            email: u.email,
            role: u.role,
            createdAt: u.createdAt,
        }));

        return NextResponse.json(users, { status: 200 });

    } catch (err) {
        console.error("Error in users API:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
