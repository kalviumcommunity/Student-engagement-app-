'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: ('MENTOR' | 'STUDENT')[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            // Not authenticated
            if (!user) {
                router.push('/login');
                return;
            }

            // Authenticated but not authorized for this route
            if (allowedRoles && !allowedRoles.includes(user.role)) {
                // Redirect to appropriate dashboard
                if (user.role === 'MENTOR') {
                    router.push('/dashboard/mentor');
                } else {
                    router.push('/dashboard/student');
                }
            }
        }
    }, [user, loading, allowedRoles, router]);

    // Show loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white text-lg">Loading...</p>
                </div>
            </div>
        );
    }

    // Not authenticated
    if (!user) {
        return null;
    }

    // Not authorized
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return null;
    }

    // Authorized - render children
    return <>{children}</>;
}
