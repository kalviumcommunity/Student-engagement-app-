import mongoose from "mongoose";

/**
 * Mongoose Connection Management
 * ==============================
 * This utility handles the connection to MongoDB using Mongoose.
 * It uses a caching mechanism to ensure that the connection is reused
 * across multiple requests in a serverless environment (like Vercel).
 */

const MONGODB_URI = process.env.DATABASE_URL;

if (!MONGODB_URI) {
    throw new Error(
        "Please define the DATABASE_URL environment variable inside .env"
    );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections from growing exponentially
 * during API Route usage.
 */
interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

declare global {
    // eslint-disable-next-line no-var
    var mongoose: MongooseCache | undefined;
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
    if (cached?.conn) {
        return cached.conn;
    }

    if (!cached?.promise) {
        const opts = {
            bufferCommands: false,
        };

        cached!.promise = mongoose.connect(MONGODB_URI!, opts).then((m: typeof mongoose) => {
            return m;
        });
    }

    try {
        cached!.conn = await cached!.promise;
    } catch (e) {
        cached!.promise = null;
        throw e;
    }

    return cached!.conn;
}

export default dbConnect;

/**
 * Enums and Types
 * ===============
 */

export enum Role {
    MENTOR = "MENTOR",
    STUDENT = "STUDENT",
}

export enum TaskStatus {
    TODO = "TODO",
    IN_PROGRESS = "IN_PROGRESS",
    DONE = "DONE",
}

export enum ActionType {
    LOGIN = "LOGIN",
    VIEW_DASHBOARD = "VIEW_DASHBOARD",
    CREATE_PROJECT = "CREATE_PROJECT",
    TASK_UPDATE = "TASK_UPDATE",
    FEEDBACK_SUBMIT = "FEEDBACK_SUBMIT",
}

// Lean Interfaces for Mongoose .lean() results
// These help avoid 'any' usage while satisfying ESLint
export interface LeanUser {
    _id: mongoose.Types.ObjectId;
    name: string;
    email: string;
    password?: string;
    role: Role;
    createdAt: Date;
    updatedAt: Date;
}

export interface LeanProject {
    _id: mongoose.Types.ObjectId;
    title: string;
    mentorId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export interface LeanProjectMember {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    projectId: mongoose.Types.ObjectId;
    joinedAt: Date;
}

export interface LeanTask {
    _id: mongoose.Types.ObjectId;
    title: string;
    status: TaskStatus;
    projectId: mongoose.Types.ObjectId;
    assignedToId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export interface LeanPeerFeedback {
    _id: mongoose.Types.ObjectId;
    projectId: mongoose.Types.ObjectId;
    reviewerId: mongoose.Types.ObjectId;
    revieweeId: mongoose.Types.ObjectId;
    content: string;
    rating: number;
    createdAt: Date;
}

export interface LeanEngagementLog {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    actionType: ActionType;
    details: string;
    timestamp: Date;
}

/**
 * Helper: Log Engagement
 */
export async function logEngagement(userId: mongoose.Types.ObjectId, actionType: ActionType, details: string = "") {
    const { EngagementLog } = await import("./models");
    const log = await EngagementLog.create({
        userId,
        actionType,
        details,
        timestamp: new Date(),
    });
    return log as unknown as LeanEngagementLog;
}
