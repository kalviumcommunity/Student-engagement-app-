'use client';

/**
 * ============================================
 * LOGOUT PAGE
 * Clean, Simple, Functional
 * Tech Stack: Next.js App Router, CSS Modules
 * ============================================
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Loader2 } from 'lucide-react';
import styles from './logout.module.css';

export default function LogoutPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    /**
     * Handles the logout process
     * 1. Calls API
     * 2. Clears storage
     * 3. Redirects
     */
    const handleLogout = async () => {
        setIsLoading(true);
        setError('');

        try {
            // Call logout API
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                // Determine if it's a real error or just already logged out
                // For user experience, we usually treat "already logged out" as success
                if (response.status !== 401) {
                    throw new Error('Logout failed. Please try again.');
                }
            }

            // SUCCESS
            // 1. Remove token
            localStorage.removeItem('token');
            // 2. Remove any other user data if stored
            localStorage.removeItem('user');

            setSuccess(true);

            // 3. Redirect after short delay
            setTimeout(() => {
                router.push('/login');
            }, 1000);

        } catch (err: any) {
            console.error('Logout Error:', err);
            setError(err.message || 'An unexpected error occurred');
            setIsLoading(false);
        }
    };

    /**
     * Cancel logout and return to previous page or dashboard
     */
    const handleCancel = () => {
        router.back();
        // fallback if no history, user can manually navigate
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>

                {/* Icon */}
                <div className={styles.iconWrapper}>
                    <LogOut size={32} />
                </div>

                {/* Content */}
                <h1 className={styles.title}>
                    Are you sure you want to logout?
                </h1>

                <p className={styles.subtitle}>
                    You will need to log in again to access your dashboard.
                </p>

                {/* Status Messages */}
                {error && <div className={styles.error}>{error}</div>}

                {success && (
                    <div className={styles.success}>
                        Success! Redirecting to login...
                    </div>
                )}

                {/* Actions */}
                <div className={styles.buttonGroup}>
                    <button
                        onClick={handleLogout}
                        className={styles.logoutButton}
                        disabled={isLoading || success}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className={styles.spinner} size={18} />
                                Logging out...
                            </>
                        ) : (
                            'Logout'
                        )}
                    </button>

                    <button
                        onClick={handleCancel}
                        className={styles.cancelButton}
                        disabled={isLoading || success}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
