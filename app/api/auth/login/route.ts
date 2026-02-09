import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dbConnect, { ActionType, logEngagement, LeanUser } from "@/lib/db";
import { User } from "@/lib/models";

import { z } from "zod";

// Validation schema
const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

// JWT secret - should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = "7d"; // Token expires in 7 days

export async function POST(request: NextRequest) {
    try {
        // Parse request body
        const body = await request.json();

        // Validate input
        const validationResult = loginSchema.safeParse(body);
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

        const { email, password } = validationResult.data;

        // Connect to database
        await dbConnect();

        // Find user by email
        const existingUser = await User.findOne({ email }).lean() as unknown as LeanUser;

        // Check if user exists
        if (!existingUser) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid email or password",
                },
                { status: 401 }
            );
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password || "", existingUser.password || "");
        if (!isPasswordValid) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid email or password",
                },
                { status: 401 }
            );
        }

        const user = {
            id: existingUser._id.toString(),
            name: existingUser.name,
            email: existingUser.email,
            role: existingUser.role,
            createdAt: existingUser.createdAt,
        };

        // Log the login engagement
        await logEngagement(user.id, ActionType.LOGIN, `User logged in from ${request.headers.get("user-agent")}`);

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
                message: "Login successful",
                user,
                token,
            },
            { status: 200 }
        );

        // Set HTTP-only cookie for added security
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
        console.error("Login error:", err);
        return NextResponse.json(
            {
                success: false,
                error: "An error occurred during login",
            },
            { status: 500 }
        );
    }
}

// Optional: GET method to check if user is already logged in
export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get("auth-token")?.value;

        if (!token) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Not authenticated",
                },
                { status: 401 }
            );
        }

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET) as {
            userId: string;
            email: string;
            role: string;
        };

        // Connect to database
        await dbConnect();

        // Get user details
        const userDoc = await User.findById(decoded.userId).select("-password").lean() as unknown as LeanUser;

        if (!userDoc) {
            return NextResponse.json(
                {
                    success: false,
                    error: "User not found",
                },
                { status: 404 }
            );
        }

        const user = {
            id: userDoc._id.toString(),
            name: userDoc.name,
            email: userDoc.email,
            role: userDoc.role,
            createdAt: userDoc.createdAt,
        };

        return NextResponse.json(
            {
                success: true,
                user,
            },
            { status: 200 }
        );
    } catch (err) {
        console.error("Login verification error:", err);
        return NextResponse.json(
            {
                success: false,
                error: "Invalid or expired token",
            },
            { status: 401 }
        );
    }
}