import { NextResponse } from "next/server";
import { prisma, Role, TaskStatus, ActionType, logEngagement } from "@/lib/db";

// ============================================
// GET /api/tasks
// ============================================
// Fetches tasks based on the logged-in user's role:
// - MENTOR: Returns tasks from projects they manage (where project.mentorId = their user ID)
// - STUDENT: Returns tasks assigned to them (where task.assignedToId = their user ID)

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

        // STEP 3: Fetch Tasks Based on Role
        // ==================================
        let tasks;

        if (userRole === Role.MENTOR) {
            // MENTOR QUERY
            // ============
            // Mentors see ALL tasks from projects they manage
            // We need to:
            // 1. Find all projects where mentorId = logged-in user
            // 2. Get all tasks from those projects

            tasks = await prisma.task.findMany({
                where: {
                    project: {
                        mentorId: userId, // Filter by project's mentor
                    },
                },
                select: {
                    id: true,
                    title: true,
                    status: true,
                    projectId: true,
                    assignedToId: true,
                    createdAt: true,
                    updatedAt: true,
                },
                orderBy: {
                    createdAt: "desc", // Newest tasks first
                },
            });

        } else if (userRole === Role.STUDENT) {
            // STUDENT QUERY
            // =============
            // Students see ONLY tasks assigned to them
            // Simple direct filter on assignedToId

            tasks = await prisma.task.findMany({
                where: {
                    assignedToId: userId, // Only tasks assigned to this student
                },
                select: {
                    id: true,
                    title: true,
                    status: true,
                    projectId: true,
                    assignedToId: true,
                    createdAt: true,
                    updatedAt: true,
                },
                orderBy: {
                    createdAt: "desc", // Newest tasks first
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

        // STEP 4: Return Tasks
        // =====================
        // Return the array of tasks
        // If no tasks found, this will be an empty array []
        // That's perfectly valid - not an error!

        return NextResponse.json(tasks, { status: 200 });

    } catch (error) {
        // STEP 5: Error Handling
        // =======================
        console.error("Error fetching tasks:", error);

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}


// ============================================
// POST /api/tasks
// ============================================
// Creates a new task for a project
// Only MENTORS can create tasks
// Tasks must be assigned to a project member

// Define the shape of the request body for type safety
interface CreateTaskBody {
    title: string;
    projectId: string;
    assignedToId: string;
}

export async function POST(request: Request) {
    try {
        // STEP 1: Read Authentication Headers
        // ====================================
        // Extract user ID and role from request headers
        // These are set by the frontend when making the request
        const userId = request.headers.get("x-user-id");
        const userRole = request.headers.get("x-user-role");

        // STEP 2: Authentication Check
        // =============================
        // If no user ID is provided, the user is NOT logged in
        // Return 401 Unauthorized
        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized: You must be logged in" },
                { status: 401 }
            );
        }

        // STEP 3: Authorization Check
        // ============================
        // Only MENTORs can create tasks
        // Students should not be able to assign work to others
        if (userRole !== Role.MENTOR) {
            return NextResponse.json(
                { error: "Only mentors can create tasks" },
                { status: 403 }
            );
        }

        // STEP 4: Parse Request Body
        // ===========================
        // Extract the task data from the JSON body
        let body: CreateTaskBody;
        try {
            body = await request.json();
        } catch (e) {
            return NextResponse.json(
                { error: "Invalid JSON body" },
                { status: 400 }
            );
        }

        const { title, projectId, assignedToId } = body;

        // STEP 5: Input Validation
        // =========================
        // Check that all required fields are present and not empty
        if (!title || !projectId || !assignedToId) {
            return NextResponse.json(
                { error: "title, projectId, and assignedToId are required" },
                { status: 400 }
            );
        }

        // Validate title is not just whitespace
        if (title.trim() === "") {
            return NextResponse.json(
                { error: "Task title cannot be empty" },
                { status: 400 }
            );
        }

        const trimmedTitle = title.trim();

        // STEP 6: Database Validation Checks
        // ===================================
        // Before creating the task, we need to verify:
        // 1. The project exists
        // 2. The user being assigned exists
        // 3. The assigned user is a member of the project

        // Check 1: Verify the project exists
        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 400 }
            );
        }

        // Check 2: Verify the assigned user exists
        const assignedUser = await prisma.user.findUnique({
            where: { id: assignedToId },
        });

        if (!assignedUser) {
            return NextResponse.json(
                { error: "Assigned user not found" },
                { status: 400 }
            );
        }

        // Check 3: Verify the assigned user is a member of the project
        // This is CRITICAL - we can't assign tasks to people not in the project!
        // We check the ProjectMember table for a matching record
        const projectMembership = await prisma.projectMember.findFirst({
            where: {
                projectId: projectId,
                userId: assignedToId,
            },
        });

        if (!projectMembership) {
            return NextResponse.json(
                {
                    error: `User ${assignedUser.name} is not a member of this project. Add them to the project first.`
                },
                { status: 400 }
            );
        }

        // STEP 7: Create the Task
        // ========================
        // All validations passed - create the task in the database
        // The status defaults to "TODO" as defined in TaskStatus
        const task = await prisma.task.create({
            data: {
                title: trimmedTitle,
                status: TaskStatus.TODO, // Default status for new tasks
                projectId: projectId,
                assignedToId: assignedToId,
            },
        });

        // STEP 8: Log Engagement
        // ======================
        // Track that the mentor created a task
        // This helps with analytics and activity tracking
        await logEngagement(
            userId, // The mentor who created the task
            ActionType.TASK_UPDATE,
            `Created task: ${trimmedTitle} for project ${project.title}`
        );

        // STEP 9: Return Success Response
        // ================================
        // Return 201 Created with the task details
        return NextResponse.json(
            {
                id: task.id,
                title: task.title,
                status: task.status,
                projectId: task.projectId,
                assignedToId: task.assignedToId,
                createdAt: task.createdAt,
            },
            { status: 201 }
        );

    } catch (error) {
        // STEP 10: Error Handling
        // ========================
        // Catch any unexpected errors (database errors, network issues, etc.)
        console.error("Error creating task:", error);

        // Check if it's a Prisma foreign key constraint error
        // This happens if projectId or assignedToId references don't exist
        if (error instanceof Error && error.message.includes("Foreign key constraint")) {
            return NextResponse.json(
                { error: "Invalid projectId or assignedToId reference" },
                { status: 400 }
            );
        }

        // Generic error response for all other errors
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
