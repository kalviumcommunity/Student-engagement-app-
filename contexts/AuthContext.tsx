'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// Types
interface User {
    id: string;
    name: string;
    email: string;
    role: 'MENTOR' | 'STUDENT';
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    register: (name: string, email: string, password: string, role: 'MENTOR' | 'STUDENT') => Promise<void>;
}

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider Component
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Check for existing session on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (error) {
                console.error('Failed to parse stored user:', error);
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    // Login function
    const login = async (email: string, password: string) => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Login failed');
            }

            const data = await response.json();

            // Store user data
            const userData: User = {
                id: data.user.id,
                name: data.user.name,
                email: data.user.email,
                role: data.user.role,
            };

            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));

            // Redirect based on role
            if (userData.role === 'MENTOR') {
                router.push('/dashboard/mentor');
            } else {
                router.push('/dashboard/student');
            }
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    // Register function
    const register = async (name: string, email: string, password: string, role: 'MENTOR' | 'STUDENT') => {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password, role }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Registration failed');
            }

            // After successful registration, redirect to login
            router.push('/login');
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    };

    // Logout function
    const logout = async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setUser(null);
            localStorage.removeItem('user');
            router.push('/login');
        }
    };

    const value = {
        user,
        loading,
        login,
        logout,
        register,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Helper function to get auth headers
export function getAuthHeaders(user: User | null): HeadersInit {
    if (!user) {
        return {};
    }

    return {
        'x-user-id': user.id,
        'x-user-role': user.role,
    };
}
