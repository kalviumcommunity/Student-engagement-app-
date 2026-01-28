'use client';

/**
 * ============================================
 * PREMIUM HIGH-FIDELITY SIGNUP PAGE
 * Tech Stack: CSS Modules, Framer Motion, Lucide
 * Design: Mesh Gradients, Glassmorphism, Staggered Load
 * ============================================
 */

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2,
    Loader2,
    GraduationCap,
    School,
    User,
    Mail,
    Lock,
    Chrome,
    Github,
    AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import styles from './signup.module.css';

type UserRole = 'STUDENT' | 'MENTOR';

interface FormData {
    name: string;
    email: string;
    password: string;
    role: UserRole;
}

export default function SignupPage() {
    const router = useRouter();

    const [formData, setFormData] = useState<FormData>({
        name: '',
        email: '',
        password: '',
        role: 'STUDENT',
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Validation
    const isFormValid =
        formData.name.trim() !== '' &&
        formData.email.trim() !== '' &&
        formData.password.length >= 8;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!isFormValid) return;

        setError('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Registration failed. Try again.');
            }

            // --- AUTO-LOGIN LOGIC ---
            // Store session in localStorage for immediate access
            if (data.token && data.user) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('userId', data.user.id);
                localStorage.setItem('userRole', data.user.role);
            }

            setSuccess(true);

            // --- ROLE-BASED REDIRECTION ---
            setTimeout(() => {
                if (data.user.role === 'MENTOR') {
                    // Redirect Mentors to the new Premium Vanilla Hub
                    window.location.href = '/mentor-hub-vanilla/dashboard.html';
                } else {
                    // Redirect Students to the standard Next.js Dashboard
                    router.push('/dashboard/student');
                }
            }, 2000);

        } catch (err: any) {
            setError(err.message);
        } finally {
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

    if (success) {
        return (
            <div className={styles.container}>
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`${styles.card} ${styles.successCard}`}
                >
                    <div className={styles.successIcon}>
                        <CheckCircle2 size={32} />
                    </div>
                    <h2 className={styles.title}>Account Created!</h2>
                    <p className={styles.subtitle}>
                        Welcome to the platform. We're getting things ready for you...
                    </p>
                    <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
                        <Loader2 className={styles.spinner} color="#6366f1" size={32} />
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className={styles.card}
            >
                {/* Header */}
                <div className={styles.header}>
                    <motion.div
                        initial={{ scale: 0.5, rotate: -20, opacity: 0 }}
                        animate={{ scale: 1, rotate: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className={styles.iconWrapper}
                    >
                        <User size={28} />
                    </motion.div>
                    <motion.h1 variants={fadeInUp} initial="initial" animate="animate" className={styles.title}>
                        Join CollabLearn
                    </motion.h1>
                    <motion.p variants={fadeInUp} initial="initial" animate="animate" className={styles.subtitle}>
                        Start your journey with us today
                    </motion.p>
                </div>

                {/* Error Message */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={styles.error}
                        >
                            <AlertCircle size={18} />
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.form
                    variants={stagger}
                    initial="initial"
                    animate="animate"
                    onSubmit={handleSubmit}
                    className={styles.form}
                >
                    {/* Role Selection */}
                    <motion.div variants={fadeInUp} className={styles.roleGrid}>
                        <div
                            onClick={() => setFormData({ ...formData, role: 'STUDENT' })}
                            className={`${styles.roleCard} ${formData.role === 'STUDENT' ? styles.roleCardStudentActive : ''}`}
                        >
                            <div className={styles.roleIcon}>
                                <GraduationCap size={20} />
                            </div>
                            <div className={styles.roleTitle}>Student</div>
                            <div className={styles.roleDesc}>Browse & learn</div>

                            {formData.role === 'STUDENT' && (
                                <motion.div layoutId="selectionCheck" className={styles.checkIcon}>
                                    <CheckCircle2 size={16} color="#6366f1" />
                                </motion.div>
                            )}
                        </div>

                        <div
                            onClick={() => setFormData({ ...formData, role: 'MENTOR' })}
                            className={`${styles.roleCard} ${formData.role === 'MENTOR' ? styles.roleCardMentorActive : ''}`}
                        >
                            <div className={styles.roleIcon}>
                                <School size={20} />
                            </div>
                            <div className={styles.roleTitle}>Mentor</div>
                            <div className={styles.roleDesc}>Guide others</div>

                            {formData.role === 'MENTOR' && (
                                <motion.div layoutId="selectionCheck" className={styles.checkIcon}>
                                    <CheckCircle2 size={16} color="#0ea5e9" />
                                </motion.div>
                            )}
                        </div>
                    </motion.div>

                    {/* Input Fields */}
                    <motion.div variants={fadeInUp} className={styles.formGroup}>
                        <label className={styles.label}>Full Name</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                placeholder="Enter your name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                className={styles.input}
                                disabled={isLoading}
                            />
                        </div>
                    </motion.div>

                    <motion.div variants={fadeInUp} className={styles.formGroup}>
                        <label className={styles.label}>Email Address</label>
                        <input
                            type="email"
                            placeholder="name@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            className={styles.input}
                            disabled={isLoading}
                        />
                    </motion.div>

                    <motion.div variants={fadeInUp} className={styles.formGroup}>
                        <label className={styles.label}>Password</label>
                        <input
                            type="password"
                            placeholder="Minimum 8 characters"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                            className={styles.input}
                            disabled={isLoading}
                        />
                        <p className={styles.helperText}>Use a mix of letters and numbers</p>
                    </motion.div>

                    <motion.button
                        variants={fadeInUp}
                        whileHover={{ scale: isLoading ? 1 : 1.01 }}
                        whileTap={{ scale: isLoading ? 1 : 0.99 }}
                        type="submit"
                        disabled={!isFormValid || isLoading}
                        className={styles.submitButton}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className={styles.spinner} size={20} />
                                Creating Account...
                            </>
                        ) : (
                            'Create Free Account'
                        )}
                    </motion.button>
                </motion.form>

                {/* Social Login Section */}
                <motion.div variants={fadeInUp} initial="initial" animate="animate">
                    <div className={styles.socialHeader}>
                        <span className={styles.socialHeaderText}>or continue with</span>
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

                <motion.div
                    variants={fadeInUp}
                    initial="initial"
                    animate="animate"
                    className={styles.footer}
                >
                    Already have an account?{' '}
                    <Link href="/login" className={styles.link}>
                        Sign in now
                    </Link>
                </motion.div>
            </motion.div>
        </div>
    );
}
