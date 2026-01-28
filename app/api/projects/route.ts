import { NextResponse } from "next/server";
import { prisma, Role } from "@/lib/db";

// ============================================
// GET /api/projects
// ============================================
// Fetches projects based on the logged-in user's role:
// - MENTOR: Returns projects they created (where mentorId = their user ID)
// - STUDENT: Returns projects they are a member of (via ProjectMember table)

export async function GET(request: Request) {
    try {
        // STEP 1: Read Authentication Headers
        // ====================================
        // We read the user's ID and role from the request headers.
        // These headers are set by the frontend when making the request.
        // In a real app, this would be validated by middleware or JWT tokens.
        const userId = request.headers.get("x-user-id");
        const userRole = request.headers.get("x-user-role");

        // STEP 2: Authentication Check
        // =============================
        // If there's no user ID in the headers, the user is NOT logged in.
        // We return a 401 Unauthorized error.
        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized: You must be logged in" },
                { status: 401 }
            );
        }

        // STEP 3: Authorization & Data Fetching Based on Role
        // ====================================================
        // Different roles see different projects:
        // - MENTORs see projects they created
        // - STUDENTs see projects they joined

        let projects;

        if (userRole === Role.MENTOR) {
            // MENTOR QUERY
            // ============
            // Fetch all projects where this mentor is the creator.
            // We use Prisma's `findMany` with a `where` clause.
            // The `mentorId` field in the Project table stores who created it.

            projects = await prisma.project.findMany({
                where: {
                    mentorId: userId, // Only projects created by this mentor
                },
                select: {
                    id: true,
                    title: true,
                    mentorId: true,
                    createdAt: true,
                    updatedAt: true,
                },
                orderBy: {
                    createdAt: "desc", // Newest projects first
                },
            });

        } else if (userRole === Role.STUDENT) {
            // STUDENT QUERY
            // =============
            // Students see projects they are members of.
            // This requires a JOIN between ProjectMember and Project tables.
            // 
            // How it works:
            // 1. Find all ProjectMember records where userId = student's ID
            // 2. For each ProjectMember, include the related Project data
            // 3. Extract just the project information

            const projectMemberships = await prisma.projectMember.findMany({
                where: {
                    userId: userId, // Only memberships for this student
                },
                include: {
                    project: true, // Include the full Project data (this is the JOIN)
                },
            });

            // Extract just the project data from the memberships
            // We map over the array and pull out the 'project' field from each membership
            projects = projectMemberships.map((membership) => ({
                id: membership.project.id,
                title: membership.project.title,
                mentorId: membership.project.mentorId,
                createdAt: membership.project.createdAt,
                updatedAt: membership.project.updatedAt,
            }));

        } else {
            // INVALID ROLE
            // ============
            // If the role is neither MENTOR nor STUDENT, deny access.
            // This prevents unauthorized access if someone sends a fake role.
            return NextResponse.json(
                { error: "Forbidden: Invalid role" },
                { status: 403 }
            );
        }

        // STEP 4: Return the Projects
        // ============================
        // Return the array of projects with a 200 OK status.
        // If no projects are found, this will be an empty array [].
        // That's perfectly fine - it's not an error!

        return NextResponse.json(projects, { status: 200 });

    } catch (error) {
        // STEP 5: Error Handling
        // =======================
        // If anything goes wrong (database error, network issue, etc.),
        // we log the error and return a generic 500 error to the client.
        // We don't expose internal error details for security reasons.

        console.error("Error fetching projects:", error);

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}


// Define the shape of the expected request body for clarity
interface CreateProjectBody {
    title: string;
}

export async function POST(request: Request) {
    try {
        // 1. Read Authentication Headers
        // In a real app, this would be validated by middleware or a session library.
        // Here we trust the headers for temporary auth as requested.
        const userId = request.headers.get("x-user-id");
        const userRole = request.headers.get("x-user-role");





        // 2. Authentication Check
        // If no user ID is provided, the user is not logged in.
        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized: You must be logged in" },
                { status: 401 }
            );
        }

        // 3. Authorization Check
        // Only MENTORs can create projects.
        if (userRole !== Role.MENTOR) {
            return NextResponse.json(
                { error: "Only mentors can create projects" },
                { status: 403 }
            );
        }

        // 4. Parse Request Body
        // We expect a JSON body with a 'title'.
        let body: CreateProjectBody;
        try {
            body = await request.json();
        } catch (e) {
            return NextResponse.json(
                { error: "Invalid JSON body" },
                { status: 400 }
            );
        }

        const { title } = body;

        // 5. Validation
        // Check if title exists and is not just whitespace.
        if (!title || title.trim() === "") {
            return NextResponse.json(
                { error: "Project title is required" },
                { status: 400 }
            );
        }

        const trimmedTitle = title.trim();

        // 6. Database Operation (Transactional)
        // We use a transaction because we need to do TWO things:
        // A. Create the Project
        // B. Add the creator (Mentor) as a ProjectMember
        // If B fails, A should happen either.
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

            // Return the project data we want to send back
            return project;
        });

        // 7. Response
        // Return 201 Created with the project details.
        return NextResponse.json(
            {
                projectId: result.id,
                title: result.title,
                mentorId: result.mentorId,
                createdAt: result.createdAt,
            },
            { status: 201 }
        );
    } catch (error) {
        // 8. Error Handling
        console.error("Error creating project:", error);



        // Differentiate between generic errors and Prisma errors if needed.
        // For now, a generic 500 is safe.
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
