'use client';

/**
 * ============================================
 * PREMIUM HIGH-FIDELITY LOGIN PAGE
 * Tech Stack: CSS Modules, Framer Motion, Lucide
 * Design: Mesh Gradients, Glassmorphism, Staggered Load
 * ============================================
 */

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LogIn,
    Loader2,
    Mail,
    Lock,
    Chrome,
    Github,
    AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import styles from './login.module.css';

export default function LoginPage() {
    const router = useRouter();

    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    /**
     * Handles the login form submission
     */
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Invalid credentials. Please check and try again.');
            }

            // SUCCESS
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.user.id);
            localStorage.setItem('userRole', data.user.role);

            setTimeout(() => {
                if (data.user.role === 'MENTOR') {
                    // Redirect Mentors to the Next.js Dashboard
                    router.push('/dashboard/mentor');
                } else {
                    // Redirect Students to the standard Next.js Dashboard
                    router.push('/dashboard/student');
                }
            }, 800);

        } catch (err: any) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    // Animation Variants
    const stagger = {
        animate: {
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const fadeInUp = {
        initial: { y: 20, opacity: 0 },
        animate: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } }
    };

    return (
        <div className={styles.container}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className={styles.card}
            >
                {/* Header */}
                <div className={styles.header}>
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className={styles.iconWrapper}
                    >
                        <LogIn size={24} />
                    </motion.div>
                    <motion.h1 variants={fadeInUp} initial="initial" animate="animate" className={styles.title}>
                        Welcome Back
                    </motion.h1>
                    <motion.p variants={fadeInUp} initial="initial" animate="animate" className={styles.subtitle}>
                        Enter your credentials to access your account
                    </motion.p>
                </div>

                {/* Error Message */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className={styles.error}
                        >
                            <AlertCircle size={18} />
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Form */}
                <motion.form
                    variants={stagger}
                    initial="initial"
                    animate="animate"
                    onSubmit={handleSubmit}
                    className={styles.form}
                >
                    <motion.div variants={fadeInUp} className={styles.formGroup}>
                        <label className={styles.label}>Email Address</label>
                        <input
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isLoading}
                            className={styles.input}
                        />
                    </motion.div>

                    <motion.div variants={fadeInUp} className={styles.formGroup}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label className={styles.label}>Password</label>
                            <Link href="/forgot-password" className={styles.link} style={{ fontSize: '0.75rem', padding: 0 }}>
                                Forgot?
                            </Link>
                        </div>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading}
                            className={styles.input}
                        />
                    </motion.div>

                    <motion.button
                        variants={fadeInUp}
                        whileHover={{ scale: isLoading ? 1 : 1.01 }}
                        whileTap={{ scale: isLoading ? 1 : 0.99 }}
                        type="submit"
                        disabled={isLoading}
                        className={styles.loginButton}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className={styles.spinner} size={20} />
                                Authenticating...
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </motion.button>
                </motion.form>

                {/* Social Login Section */}
                <motion.div variants={fadeInUp} initial="initial" animate="animate">
                    <div className={styles.socialHeader}>
                        <span className={styles.socialHeaderText}>or sign in with</span>
                    </div>
                    <div className={styles.socialGrid}>
                        <button className={styles.socialButton}>
                            <Chrome size={18} color="#EA4335" />
                            <span>Google</span>
                        </button>
                        <button className={styles.socialButton}>
                            <Github size={18} color="#24292F" />
                            <span>GitHub</span>
                        </button>
                    </div>
                </motion.div>

                {/* Footer */}
                <motion.div
                    variants={fadeInUp}
                    initial="initial"
                    animate="animate"
                    className={styles.footer}
                >
                    Don’t have an account?{' '}
                    <Link href="/signup" className={styles.link}>
                        Create one for free
                    </Link>
                </motion.div>
            </motion.div>
        </div>
    );
}
