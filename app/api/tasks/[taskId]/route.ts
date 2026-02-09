import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import dbConnect, { ActionType, logEngagement, LeanTask, LeanProject } from "@/lib/db";
import { Task } from "@/lib/models";

export async function GET(
    request: Request,
    props: { params: Promise<{ taskId: string }> }
) {
    try {
        // 1. Extract taskId from URL params (Next.js 15: params is a Promise)
        const params = await props.params;
        const taskId = params.taskId;

        // Optional: Basic validation of taskId
        if (!taskId || typeof taskId !== "string") {
            return NextResponse.json(
                { error: "Invalid task ID" },
                { status: 400 }
            );
        }

        // 2. Authentication: Read headers
        const loggedInUserId = request.headers.get("x-user-id");
        const loggedInUserRole = request.headers.get("x-user-role");

        // Check if user is authenticated
        if (!loggedInUserId) {
            return NextResponse.json(
                { error: "Unauthorized: Missing authentication credentials" },
                { status: 401 }
            );
        }

        // Connect to database
        await dbConnect();

        // 3. Fetch Task with Project relation
        // We need the project relation to check mentor ownership
        const taskDoc = await Task.findById(taskId).populate('projectId').lean() as unknown as (LeanTask & { projectId: LeanProject });

        // Handle Task Not Found
        if (!taskDoc) {
            return NextResponse.json(
                { error: "Task not found" },
                { status: 404 }
            );
        }

        const task = {
            ...taskDoc,
            id: taskDoc._id.toString(),
            projectId: taskDoc.projectId._id.toString(),
            assignedToId: taskDoc.assignedToId ? taskDoc.assignedToId.toString() : null,
            project: {
                id: taskDoc.projectId._id.toString(),
                mentorId: taskDoc.projectId.mentorId.toString()
            }
        };

        // Defensive: Ensure project relation exists
        // This should always be true due to schema constraints, but defensive programming is good
        if (!task.project) {
            console.error("Task found but project relation is missing:", taskId);
            return NextResponse.json(
                { error: "Task project not found" },
                { status: 500 }
            );
        }

        // 4. Authorization: Role-based access control
        let hasAccess = false;

        if (loggedInUserRole === "STUDENT") {
            // Students can only view tasks assigned to them
            hasAccess = task.assignedToId === loggedInUserId;
        } else if (loggedInUserRole === "MENTOR") {
            // Mentors can only view tasks in their own projects
            hasAccess = task.project.mentorId === loggedInUserId;
        }

        if (!hasAccess) {
            return NextResponse.json(
                { error: "Forbidden: You are not allowed to view this task" },
                { status: 403 }
            );
        }

        // 5. Return Task Details
        // Return all task fields as specified
        return NextResponse.json(
            {
                id: task.id,
                title: task.title,
                status: task.status,
                projectId: task.projectId,
                assignedToId: task.assignedToId,
                createdAt: task.createdAt,
                updatedAt: task.updatedAt,
            },
            { status: 200 }
        );
    } catch (err) {
        console.error("Error fetching task details:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// ============================================
// PUT /api/tasks/[taskId]
// ============================================
// Updates an existing task
// Authorization: Mentors (project owners) or assigned students

export async function PUT(
    request: Request,
    props: { params: Promise<{ taskId: string }> }
) {
    try {
        // STEP 1: Extract taskId from URL
        // ================================
        const params = await props.params;
        const taskId = params.taskId;

        // STEP 2: Authentication
        // ======================
        const loggedInUserId = request.headers.get("x-user-id");
        const loggedInUserRole = request.headers.get("x-user-role");

        if (!loggedInUserId) {
            return NextResponse.json(
                { error: "Unauthorized: Missing authentication credentials" },
                { status: 401 }
            );
        }

        // Connect to database
        await dbConnect();

        // STEP 3: Fetch Task with Project
        // ================================
        const taskDoc = await Task.findById(taskId).populate('projectId').lean() as unknown as (LeanTask & { projectId: LeanProject });

        if (!taskDoc) {
            return NextResponse.json(
                { error: "Task not found" },
                { status: 404 }
            );
        }

        const task = {
            ...taskDoc,
            id: taskDoc._id.toString(),
            projectId: taskDoc.projectId._id.toString(),
            assignedToId: taskDoc.assignedToId ? taskDoc.assignedToId.toString() : null,
            project: {
                id: taskDoc.projectId._id.toString(),
                mentorId: taskDoc.projectId.mentorId.toString()
            }
        };

        // STEP 4: Authorization
        // =====================
        let hasAccess = false;

        if (loggedInUserRole === "STUDENT") {
            // Students can only update tasks assigned to them
            hasAccess = task.assignedToId === loggedInUserId;
        } else if (loggedInUserRole === "MENTOR") {
            // Mentors can update tasks in their own projects
            hasAccess = task.project.mentorId === loggedInUserId;
        }

        if (!hasAccess) {
            return NextResponse.json(
                { error: "Forbidden: You are not allowed to update this task" },
                { status: 403 }
            );
        }

        // STEP 5: Parse Request Body
        // ===========================
        const body = await request.json();
        const { title, status, assignedToId } = body;

        // Build update data object (only include provided fields)
        const updateData: Partial<LeanTask> = {};

        if (title !== undefined) {
            if (title.trim() === "") {
                return NextResponse.json(
                    { error: "Task title cannot be empty" },
                    { status: 400 }
                );
            }
            updateData.title = title.trim();
        }

        if (status !== undefined) {
            // Validate status enum
            const validStatuses = ["TODO", "IN_PROGRESS", "DONE"];
            if (!validStatuses.includes(status)) {
                return NextResponse.json(
                    { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
                    { status: 400 }
                );
            }
            updateData.status = status;
        }

        if (assignedToId !== undefined) {
            // Only mentors can reassign tasks
            if (loggedInUserRole !== "MENTOR") {
                return NextResponse.json(
                    { error: "Only mentors can reassign tasks" },
                    { status: 403 }
                );
            }
            updateData.assignedToId = assignedToId;
        }

        // STEP 6: Update Task
        // ===================
        const updatedTaskDoc = await Task.findByIdAndUpdate(
            taskId,
            updateData,
            { new: true }
        ).lean() as unknown as LeanTask;

        if (!updatedTaskDoc) {
            return NextResponse.json(
                { error: "Failed to update task" },
                { status: 500 }
            );
        }

        const updatedTask = {
            ...updatedTaskDoc,
            id: updatedTaskDoc._id.toString(),
            projectId: updatedTaskDoc.projectId.toString(),
            assignedToId: updatedTaskDoc.assignedToId ? updatedTaskDoc.assignedToId.toString() : null
        };

        // STEP 7: Log Engagement
        // ======================
        await logEngagement(loggedInUserId, ActionType.TASK_UPDATE, `Updated task: ${updatedTask.title}`);

        // STEP 8: Return Updated Task
        // ============================
        return NextResponse.json(
            {
                id: updatedTask.id,
                title: updatedTask.title,
                status: updatedTask.status,
                projectId: updatedTask.projectId,
                assignedToId: updatedTask.assignedToId,
                createdAt: (updatedTask as unknown as LeanTask).createdAt,
                updatedAt: (updatedTask as unknown as LeanTask).updatedAt,
            },
            { status: 200 }
        );

    } catch (err) {
        console.error("Error updating task:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// ============================================
// DELETE /api/tasks/[taskId]
// ============================================
// Deletes a task
// Only MENTORS (project owners) can delete tasks

export async function DELETE(
    request: Request,
    props: { params: Promise<{ taskId: string }> }
) {
    try {
        // STEP 1: Extract taskId
        // =======================
        const params = await props.params;
        const taskId = params.taskId;

        // STEP 2: Authentication
        // ======================
        const loggedInUserId = request.headers.get("x-user-id");
        const loggedInUserRole = request.headers.get("x-user-role");

        if (!loggedInUserId) {
            return NextResponse.json(
                { error: "Unauthorized: Missing authentication credentials" },
                { status: 401 }
            );
        }

        // STEP 3: Authorization - Mentor Only
        // ====================================
        if (loggedInUserRole !== "MENTOR") {
            return NextResponse.json(
                { error: "Only mentors can delete tasks" },
                { status: 403 }
            );
        }

        // Connect to database
        await dbConnect();

        // STEP 4: Fetch Task with Project
        // ================================
        const taskDoc = await Task.findById(taskId).populate('projectId').lean() as unknown as (LeanTask & { projectId: LeanProject });

        if (!taskDoc) {
            return NextResponse.json(
                { error: "Task not found" },
                { status: 404 }
            );
        }

        const task = {
            ...taskDoc,
            id: taskDoc._id.toString(),
            projectId: taskDoc.projectId._id.toString(),
            project: {
                id: taskDoc.projectId._id.toString(),
                mentorId: taskDoc.projectId.mentorId.toString()
            }
        };

        // STEP 5: Verify Ownership
        // =========================
        // Only the project mentor can delete tasks
        if (task.project.mentorId !== loggedInUserId) {
            return NextResponse.json(
                { error: "Access denied: You can only delete tasks from your own projects" },
                { status: 403 }
            );
        }

        // STEP 6: Delete Task
        // ===================
        await Task.findByIdAndDelete(taskId);

        // STEP 7: Return Success
        // ======================
        return NextResponse.json(
            { message: "Task deleted successfully" },
            { status: 200 }
        );

    } catch (err) {
        console.error("Error fetching task:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
