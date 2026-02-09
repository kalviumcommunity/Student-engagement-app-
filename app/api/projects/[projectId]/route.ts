import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { prisma, Role } from "@/lib/db";

// ============================================
// GET /api/projects/[projectId]
// ============================================
// Fetches a single project's details with statistics
// Authorization:
// - MENTOR: Can only view their own projects
// - STUDENT: Can only view projects they're members of

export async function GET(
    request: Request,
    { params }: { params: Promise<{ projectId: string }> }
) {
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

        // STEP 3: Get Project ID from URL
        // ================================
        // In Next.js 15+, params is a Promise and must be awaited
        const { projectId } = await params;

        // STEP 4: Fetch Project
        // =====================
        // Get the project and check if it exists
        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        // STEP 5: Authorization Check (Role-Based)
        // =========================================
        // Different access rules for MENTOR vs STUDENT

        if (userRole === Role.MENTOR) {
            // MENTOR AUTHORIZATION
            // ====================
            // Mentors can ONLY view projects they created
            // Check if the project's mentorId matches the logged-in user

            if (project.mentorId !== userId) {
                return NextResponse.json(
                    { error: "Access denied: You can only view your own projects" },
                    { status: 403 }
                );
            }

        } else if (userRole === Role.STUDENT) {
            // STUDENT AUTHORIZATION
            // =====================
            // Students can ONLY view projects they're members of
            // Check if there's a ProjectMember record for this user + project

            const membership = await prisma.projectMember.findFirst({
                where: {
                    projectId: projectId,
                    userId: userId,
                },
            });

            if (!membership) {
                return NextResponse.json(
                    { error: "Access denied: You are not a member of this project" },
                    { status: 403 }
                );
            }

        } else {
            // INVALID ROLE
            // ============
            return NextResponse.json(
                { error: "Invalid user role" },
                { status: 403 }
            );
        }

        // STEP 6: Calculate Statistics
        // =============================
        // Get counts for tasks and members
        // These are simple aggregations that help the frontend display stats

        // Count total tasks in this project
        const totalTasks = await prisma.task.count({
            where: { projectId: projectId },
        });

        // Count total members in this project
        const totalMembers = await prisma.projectMember.count({
            where: { projectId: projectId },
        });

        // STEP 7: Return Project Details
        // ===============================
        return NextResponse.json(
            {
                id: project.id,
                title: project.title,
                mentorId: project.mentorId,
                createdAt: project.createdAt,
                updatedAt: project.updatedAt,
                totalTasks: totalTasks,
                totalMembers: totalMembers,
            },
            { status: 200 }
        );

    } catch (error) {
        // STEP 8: Error Handling
        // =======================
        console.error("Error fetching project:", error);

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// ============================================
// PUT /api/projects/[projectId]
// ============================================
// Updates a project
// Only MENTORS (project owners) can update their projects

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        // STEP 1: Authentication
        // ======================
        const userId = request.headers.get("x-user-id");
        const userRole = request.headers.get("x-user-role");

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized: You must be logged in" },
                { status: 401 }
            );
        }

        // STEP 2: Authorization - Mentor Only
        // ====================================
        if (userRole !== "MENTOR") {
            return NextResponse.json(
                { error: "Only mentors can update projects" },
                { status: 403 }
            );
        }

        // STEP 3: Get Project ID
        // ======================
        const { projectId } = await params;

        // STEP 4: Verify Project Exists and Ownership
        // ============================================
        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        if (project.mentorId !== userId) {
            return NextResponse.json(
                { error: "Access denied: You can only update your own projects" },
                { status: 403 }
            );
        }

        // STEP 5: Parse Request Body
        // ===========================
        const body = await request.json();
        const { title } = body;

        if (!title || title.trim() === "") {
            return NextResponse.json(
                { error: "Project title is required and cannot be empty" },
                { status: 400 }
            );
        }

        // STEP 6: Update Project
        // ======================
        const updatedProject = await prisma.project.update({
            where: { id: projectId },
            data: {
                title: title.trim(),
            },
        });

        // STEP 7: Return Updated Project
        // ===============================
        return NextResponse.json(
            {
                id: updatedProject.id,
                title: updatedProject.title,
                mentorId: updatedProject.mentorId,
                createdAt: updatedProject.createdAt,
                updatedAt: updatedProject.updatedAt,
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("Error updating project:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// ============================================
// DELETE /api/projects/[projectId]
// ============================================
// Deletes a project and all associated data
// Only MENTORS (project owners) can delete their projects

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        // STEP 1: Authentication
        // ======================
        const userId = request.headers.get("x-user-id");
        const userRole = request.headers.get("x-user-role");

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized: You must be logged in" },
                { status: 401 }
            );
        }

        // STEP 2: Authorization - Mentor Only
        // ====================================
        if (userRole !== "MENTOR") {
            return NextResponse.json(
                { error: "Only mentors can delete projects" },
                { status: 403 }
            );
        }

        // STEP 3: Get Project ID
        // ======================
        const { projectId } = await params;

        // STEP 4: Verify Project Exists and Ownership
        // ============================================
        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        if (project.mentorId !== userId) {
            return NextResponse.json(
                { error: "Access denied: You can only delete your own projects" },
                { status: 403 }
            );
        }

        // STEP 5: Delete Project
        // ======================
        // Note: Cascade deletion is handled by Prisma schema
        // This will automatically delete:
        // - ProjectMembers
        // - Tasks
        // - PeerFeedback
        await prisma.project.delete({
            where: { id: projectId },
        });

        // STEP 6: Return Success
        // ======================
        return NextResponse.json(
            { message: "Project deleted successfully" },
            { status: 200 }
        );

    } catch (error) {
        console.error("Error deleting project:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
