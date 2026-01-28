import { NextResponse } from "next/server";
import { prisma } from "@/lib/db"; // Assuming @ alias works, if not we can use relative path

export async function GET(
    request: Request,
    props: { params: Promise<{ projectId: string }> }
) {
    try {
        // 1. Get Project ID from URL (Next.js 15: params is a Promise)
        const params = await props.params;
        const projectId = params.projectId;

        // 2. Authentication: Read headers (Temporary Auth)
        const userId = request.headers.get("x-user-id");
        const userRole = request.headers.get("x-user-role");

        // Check if user is logged in
        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized: Missing User ID" },
                { status: 401 }
            );
        }

        // 3. Fetch Project (including Mentor info)
        // We need the mentor ID to check ownership access
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                mentor: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                    },
                },
            },
        });

        // Handle Project Not Found
        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        // 4. Authorization & Security
        // Access allowed if:
        // a) User is the Mentor (Project Owner)
        // b) User is a Project Member

        const isMentor = project.mentorId === userId;
        let isMember = false;

        // If not mentor, check if they are a member in the database
        // This optimization avoids fetching all members if access is denied later
        if (!isMentor) {
            const membership = await prisma.projectMember.findUnique({
                where: {
                    userId_projectId: {
                        userId: userId,
                        projectId: projectId,
                    },
                },
            });
            if (membership) {
                isMember = true;
            }
        }

        // If neither mentor nor member, deny access
        if (!isMentor && !isMember) {
            return NextResponse.json(
                { error: "Access denied: You are not a member of this project" },
                { status: 403 }
            );
        }

        // 5. Fetch Members
        // Fetch all members associated with this project
        const projectMembers = await prisma.projectMember.findMany({
            where: { projectId: projectId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                    },
                },
            },
        });

        // 6. Construct Response List
        // Convert DB result to a clean array of users
        const membersList = projectMembers.map((pm) => pm.user);

        // Ensure Mentor is in the list (if not already there)
        // Sometimes the mentor might not be in the 'ProjectMember' table
        const isMentorInList = membersList.some((m) => m.id === project.mentor.id);
        if (!isMentorInList) {
            // Add mentor to the top of the list
            membersList.unshift(project.mentor);
        }

        // 7. Return Structured Response
        return NextResponse.json({
            projectId: projectId,
            members: membersList,
        }, { status: 200 });

    } catch (error) {
        console.error("Error fetching project members:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// ============================================
// POST /api/projects/[projectId]/members
// ============================================
// Adds a new member to a project
// Only MENTORS (project owners) can add members

export async function POST(
    request: Request,
    props: { params: Promise<{ projectId: string }> }
) {
    try {
        // STEP 1: Get Project ID from URL
        // ================================
        const params = await props.params;
        const projectId = params.projectId;

        // STEP 2: Authentication
        // ======================
        const userId = request.headers.get("x-user-id");
        const userRole = request.headers.get("x-user-role");

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized: Missing authentication credentials" },
                { status: 401 }
            );
        }

        // STEP 3: Authorization - Mentor Only
        // ====================================
        // Only mentors can add members to projects
        if (userRole !== "MENTOR") {
            return NextResponse.json(
                { error: "Only mentors can add members to projects" },
                { status: 403 }
            );
        }

        // STEP 4: Verify Project Exists and User is Owner
        // ================================================
        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        // Verify the logged-in mentor owns this project
        if (project.mentorId !== userId) {
            return NextResponse.json(
                { error: "Access denied: You can only add members to your own projects" },
                { status: 403 }
            );
        }

        // STEP 5: Parse Request Body
        // ===========================
        const body = await request.json();
        const { userId: memberUserId } = body;

        if (!memberUserId) {
            return NextResponse.json(
                { error: "Missing required field: userId" },
                { status: 400 }
            );
        }

        // STEP 6: Verify User Exists and is a Student
        // ============================================
        const userToAdd = await prisma.user.findUnique({
            where: { id: memberUserId },
        });

        if (!userToAdd) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Only students can be added as project members
        if (userToAdd.role !== "STUDENT") {
            return NextResponse.json(
                { error: "Only students can be added as project members" },
                { status: 400 }
            );
        }

        // STEP 7: Check if Already a Member
        // ==================================
        const existingMembership = await prisma.projectMember.findUnique({
            where: {
                userId_projectId: {
                    userId: memberUserId,
                    projectId: projectId,
                },
            },
        });

        if (existingMembership) {
            return NextResponse.json(
                { error: "User is already a member of this project" },
                { status: 409 } // Conflict
            );
        }

        // STEP 8: Add Member to Project
        // ==============================
        const projectMember = await prisma.projectMember.create({
            data: {
                userId: memberUserId,
                projectId: projectId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });

        // STEP 9: Return Success Response
        // ================================
        return NextResponse.json(
            {
                id: projectMember.id,
                userId: projectMember.userId,
                projectId: projectMember.projectId,
                joinedAt: projectMember.joinedAt,
                user: projectMember.user,
            },
            { status: 201 }
        );

    } catch (error) {
        console.error("Error adding project member:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
