import { PrismaClient } from "@prisma/client";

// Extend the global type to include prisma
declare global {
    var prisma: PrismaClient | undefined;
}

// Create a singleton instance of PrismaClient
const prismaClientSingleton = () => {
    return new PrismaClient({
        log:
            process.env.NODE_ENV === "development"
                ? ["query", "error", "warn"]
                : ["error"],
    });
};

// Use global variable to prevent multiple instances in development (hot reload)
export const prisma = globalThis.prisma ?? prismaClientSingleton();

// Store the instance globally in development to persist across hot reloads
if (process.env.NODE_ENV !== "production") {
    globalThis.prisma = prisma;
}

// Graceful shutdown
if (process.env.NODE_ENV === "production") {
    process.on("beforeExit", async () => {
        await prisma.$disconnect();
    });
}

// Export type-safe enums based on your schema
export const Role = {
    MENTOR: "MENTOR",
    STUDENT: "STUDENT",
} as const;

export const TaskStatus = {
    TODO: "TODO",
    IN_PROGRESS: "IN_PROGRESS",
    DONE: "DONE",
} as const;

export const ActionType = {
    LOGIN: "LOGIN",
    TASK_UPDATE: "TASK_UPDATE",
    FEEDBACK: "FEEDBACK",
    MEMBER_REMOVED: "MEMBER_REMOVED",
} as const;

// Export types
export type Role = (typeof Role)[keyof typeof Role];
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];
export type ActionType = (typeof ActionType)[keyof typeof ActionType];

// Helper function to log engagement
export async function logEngagement(
    userId: string,
    actionType: ActionType,
    details?: string
) {
    try {
        await prisma.engagementLog.create({
            data: {
                userId,
                actionType,
                details,
            },
        });
    } catch (error) {
        console.error("Failed to log engagement:", error);
    }
}

// Export Prisma types for use in your application
export type { User, Project, Task, PeerFeedback, EngagementLog, ProjectMember } from "@prisma/client";