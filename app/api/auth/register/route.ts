import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dbConnect, { Role, ActionType, logEngagement, LeanUser } from "@/lib/db";
import { User } from "@/lib/models";

import { z } from "zod";

// Validation schema
const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(["MENTOR", "STUDENT"]).default("STUDENT"),
});

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = "7d";

export async function POST(request: NextRequest) {
    try {
        // Parse request body
        const body = await request.json();

        // Validate input
        const validationResult = registerSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Validation failed",
                    details: validationResult.error.format(),

                },
                { status: 400 }
            );
        }

        const { name, email, password, role } = validationResult.data;

        // Connect to database
        await dbConnect();

        // Check if user already exists
        const existingUser = await User.findOne({ email }).lean() as unknown as LeanUser;

        if (existingUser) {
            return NextResponse.json(
                {
                    success: false,
                    error: "User with this email already exists",
                },
                { status: 409 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const newUserDoc = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role as Role,
        });

        const user = {
            id: newUserDoc._id.toString(),
            name: newUserDoc.name,
            email: newUserDoc.email,
            role: newUserDoc.role,
            createdAt: newUserDoc.createdAt,
        };

        // Log the registration
        await logEngagement(user.id, ActionType.LOGIN, "User registered");

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role,
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Create response
        const response = NextResponse.json(
            {
                success: true,
                message: "Registration successful",
                user,
                token,
            },
            { status: 201 }
        );

        // Set HTTP-only cookie
        response.cookies.set({
            name: "auth-token",
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/",
        });

        return response;
    } catch (err) {
        console.error("Registration error:", err);

        // Check for database connection errors
        const errorMessage = err instanceof Error ? err.message : String(err);
        if (errorMessage.includes("Can't reach database") ||
            errorMessage.includes("Connection") ||
            errorMessage.includes("ECONNREFUSED")) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Database connection failed. Please check your DATABASE_URL configuration.",
                },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                error: "An error occurred during registration",
                ...(process.env.NODE_ENV === "development" && {
                    details: errorMessage
                })
            },
            { status: 500 }
        );
    }
}