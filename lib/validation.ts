import { z } from "zod";

/**
 * VALIDATION SCHEMAS FOR PRISMA MODELS
 * 
 * Since SQLite doesn't support database-level enums, we enforce validation
 * at the application layer using Zod schemas.
 * 
 * These schemas should be used in all API routes before creating/updating data.
 */

// Role validation
export const RoleSchema = z.enum(["MENTOR", "STUDENT"]);

// Task Status validation
export const TaskStatusSchema = z.enum(["TODO", "IN_PROGRESS", "DONE"]);

// Action Type validation
export const ActionTypeSchema = z.enum(["LOGIN", "TASK_UPDATE", "FEEDBACK", "MEMBER_REMOVED"]);

// User creation/update validation
export const UserValidationSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: RoleSchema.optional().default("STUDENT"),
});

// Task creation/update validation
export const TaskValidationSchema = z.object({
    title: z.string().min(1, "Title is required").trim(),
    status: TaskStatusSchema.optional().default("TODO"),
    projectId: z.string().uuid("Invalid project ID"),
    assignedToId: z.string().uuid("Invalid user ID").optional().nullable(),
});

// Engagement log validation
export const EngagementLogValidationSchema = z.object({
    userId: z.string().uuid("Invalid user ID"),
    actionType: ActionTypeSchema,
    details: z.string().optional().nullable(),
});

// Feedback validation
export const FeedbackValidationSchema = z.object({
    projectId: z.string().uuid("Invalid project ID"),
    fromUserId: z.string().uuid("Invalid user ID"),
    toUserId: z.string().uuid("Invalid user ID"),
    rating: z.number().int().min(1).max(5, "Rating must be between 1 and 5"),
    comment: z.string().optional().default(""),
});

/**
 * Type exports for TypeScript autocomplete
 */
export type ValidRole = z.infer<typeof RoleSchema>;
export type ValidTaskStatus = z.infer<typeof TaskStatusSchema>;
export type ValidActionType = z.infer<typeof ActionTypeSchema>;

/**
 * Validation helper functions
 */

export function validateRole(role: unknown): ValidRole {
    return RoleSchema.parse(role);
}

export function validateTaskStatus(status: unknown): ValidTaskStatus {
    return TaskStatusSchema.parse(status);
}

export function validateActionType(actionType: unknown): ValidActionType {
    return ActionTypeSchema.parse(actionType);
}

/**
 * Safe validation (returns null on error instead of throwing)
 */

export function safeValidateRole(role: unknown): ValidRole | null {
    const result = RoleSchema.safeParse(role);
    return result.success ? result.data : null;
}

export function safeValidateTaskStatus(status: unknown): ValidTaskStatus | null {
    const result = TaskStatusSchema.safeParse(status);
    return result.success ? result.data : null;
}

export function safeValidateActionType(actionType: unknown): ValidActionType | null {
    const result = ActionTypeSchema.safeParse(actionType);
    return result.success ? result.data : null;
}
