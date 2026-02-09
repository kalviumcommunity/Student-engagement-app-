"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from '@/contexts/AuthContext';
import { LogOut } from "lucide-react";

export default function LogoutPage() {
    const { logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const performLogout = async () => {
            try {
                await logout();
                router.push("/login");
            } catch (error) {
                console.error("Logout failed:", error);
                router.push("/login");
            }
        };

        performLogout();
    }, [logout, router]);

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6 animate-pulse">
                <LogOut className="text-white w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Logging out...</h1>
            <p className="text-gray-400">Please wait while we secure your session.</p>
        </div>
    );
}
