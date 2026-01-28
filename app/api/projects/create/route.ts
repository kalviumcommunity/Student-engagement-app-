import { NextResponse } from "next/server";
import { prisma, Role } from "@/lib/db";

// ============================================
// POST /api/projects/create
// ============================================
// Creates a new project
// Only MENTORS can create projects
// This route is specifically created for the vanilla Create Project page demo

interface CreateProjectBody {
    title: string;
    description?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
}

export async function POST(request: Request) {
    try {
        // 1. Read Authentication Headers
        const userId = request.headers.get("x-user-id");
        const userRole = request.headers.get("x-user-role");

        // 2. Authentication Check
        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized: You must be logged in" },
                { status: 401 }
            );
        }

        // 3. Authorization Check
        if (userRole !== Role.MENTOR) {
            return NextResponse.json(
                { error: "Only mentors can create projects" },
                { status: 403 }
            );
        }

        // 4. Parse Request Body
        let body: CreateProjectBody;
        try {
            body = await request.json();
        } catch (e) {
            return NextResponse.json(
                { error: "Invalid JSON body" },
                { status: 400 }
            );
        }

        const { title, description, category, startDate, endDate } = body;

        // 5. Validation
        if (!title || title.trim() === "") {
            return NextResponse.json(
                { error: "Project title is required" },
                { status: 400 }
            );
        }

        const trimmedTitle = title.trim();

        // 6. Database Operation (Transactional)
        // Note: Prisma schema only supports 'title' and 'mentorId' for projects currently.
        // description, category, startDate, and endDate are ignored for database storage 
        // to avoid schema migration requirements, but they are accepted by the API.
        const result = await prisma.$transaction(async (tx) => {
            // Step A: Create the Project
            const project = await tx.project.create({
                data: {
                    title: trimmedTitle,
                    mentorId: userId,
                },
            });

            // Step B: Add Mentor as Member
            await tx.projectMember.create({
                data: {
                    userId: userId,
                    projectId: project.id,
                },
            });

            return project;
        });

        // 7. Response
        return NextResponse.json(
            {
                projectId: result.id,
                title: result.title,
                message: "Project created successfully! (Extra fields like description were received but not stored due to schema limits)",
                createdAt: result.createdAt,
            },
            { status: 201 }
        );

    } catch (error: any) {
        console.error("Error in /api/projects/create:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                details: error.message,
                stack: error.stack
            },
            { status: 500 }
        );
    }
}
