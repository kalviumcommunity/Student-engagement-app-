'use client';

/**
 * ============================================
 * CREATE FEEDBACK PAGE (ANIMATED)
 * Clean, Production-Quality Form with Framer Motion
 * Tech Stack: Next.js App Router, TypeScript, CSS
 * ============================================
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Send,
    User,
    Briefcase,
    MessageSquare,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import './CreateFeedback.css';

// --- TYPE DEFINITIONS ---

interface Member {
    id: string;
    name: string;
    role: string;
}

interface Project {
    id: string;
    name: string;
}

// --- ANIMATION VARIANTS ---

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { type: 'spring', stiffness: 300, damping: 24 },
    },
};

const alertVariants = {
    hidden: { opacity: 0, height: 0, marginBottom: 0 },
    visible: { opacity: 1, height: 'auto', marginBottom: '1.5rem' },
    exit: { opacity: 0, height: 0, marginBottom: 0 },
};

// --- MAIN COMPONENT ---

export default function CreateFeedbackPage() {
    const router = useRouter();

    // Data State
    const [members, setMembers] = useState<Member[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);

    // Form State
    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [feedbackText, setFeedbackText] = useState('');

    // UI State
    const [isPageLoading, setIsPageLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    /**
     * Fetch initial data for dropdowns
     */
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setIsPageLoading(true);
                // Simulating API Latency
                await new Promise((resolve) => setTimeout(resolve, 800));

                // Mock Members
                const mockMembers: Member[] = [
                    { id: 'm1', name: 'Sarah Connor', role: 'Senior Mentor' },
                    { id: 'm2', name: 'James Bond', role: 'Project Lead' },
                    { id: 'm3', name: 'Alan Turing', role: 'Technical Mentor' },
                ];

                // Mock Projects
                const mockProjects: Project[] = [
                    { id: 'p1', name: 'Web Engagement App' },
                    { id: 'p2', name: 'AI Study Assistant' },
                    { id: 'p3', name: 'Campus Maps' },
                ];

                setMembers(mockMembers);
                setProjects(mockProjects);
            } catch (err) {
                setError('Failed to load form data. Please refresh.');
            } finally {
                setIsPageLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    /**
     * Form Submission Handler
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Simple Validation
        if (!selectedMemberId || !selectedProjectId || !feedbackText.trim()) {
            setError('Please fill in all fields before submitting.');
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);

            // Simulating API POST request
            await new Promise((resolve) => setTimeout(resolve, 1500));

            setSuccess(true);

            // Redirect to feedback list after 2 seconds
            setTimeout(() => {
                router.push('/feedback');
            }, 2000);

        } catch (err) {
            setError('Something went wrong during submission. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isPageLoading) {
        return (
            <div className="formContainer pageLoading">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="pageSpinner"
                />
            </div>
        );
    }

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="formContainer"
        >
            {/* Header */}
            <motion.header variants={itemVariants} className="header">
                <Link href="/feedback" className="backBtn">
                    <ArrowLeft size={16} /> Back to Feedback List
                </Link>
                <h1 className="title">Give Feedback</h1>
            </motion.header>

            {/* Form Card */}
            <motion.div variants={itemVariants} className="formCard">
                <AnimatePresence mode="wait">
                    {error && (
                        <motion.div
                            key="error"
                            variants={alertVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="errorAlert"
                        >
                            <AlertCircle size={20} /> {error}
                        </motion.div>
                    )}

                    {success && (
                        <motion.div
                            key="success"
                            variants={alertVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="successAlert"
                        >
                            <CheckCircle2 size={20} /> Feedback submitted successfully! Redirecting...
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSubmit}>
                    {/* Member Selection */}
                    <motion.div variants={itemVariants} className="formGroup">
                        <label className="label">Select Member (Mentor/Peer)</label>
                        <div style={{ position: 'relative' }}>
                            <select
                                className="select"
                                value={selectedMemberId}
                                onChange={(e) => setSelectedMemberId(e.target.value)}
                                disabled={isSubmitting || success}
                            >
                                <option value="">Choose a member...</option>
                                {members.map(m => (
                                    <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                                ))}
                            </select>
                            <User size={18} style={{ position: 'absolute', right: '35px', top: '12px', color: '#94a3b8', pointerEvents: 'none' }} />
                        </div>
                    </motion.div>

                    {/* Project Selection */}
                    <motion.div variants={itemVariants} className="formGroup">
                        <label className="label">Select Project</label>
                        <div style={{ position: 'relative' }}>
                            <select
                                className="select"
                                value={selectedProjectId}
                                onChange={(e) => setSelectedProjectId(e.target.value)}
                                disabled={isSubmitting || success}
                            >
                                <option value="">Choose a project...</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            <Briefcase size={18} style={{ position: 'absolute', right: '35px', top: '12px', color: '#94a3b8', pointerEvents: 'none' }} />
                        </div>
                    </motion.div>

                    {/* Feedback Text */}
                    <motion.div variants={itemVariants} className="formGroup">
                        <label className="label">Your Feedback / Comments</label>
                        <div style={{ position: 'relative' }}>
                            <textarea
                                className="textarea"
                                placeholder="Write your feedback here..."
                                value={feedbackText}
                                onChange={(e) => setFeedbackText(e.target.value)}
                                disabled={isSubmitting || success}
                            />
                            <MessageSquare size={18} style={{ position: 'absolute', right: '15px', top: '12px', color: '#94a3b8', pointerEvents: 'none' }} />
                        </div>
                    </motion.div>

                    {/* Submit Button */}
                    <motion.button
                        variants={itemVariants}
                        type="submit"
                        className="submitBtn"
                        disabled={isSubmitting || success}
                        whileHover={{ scale: success ? 1 : 1.02 }}
                        whileTap={{ scale: success ? 1 : 0.98 }}
                    >
                        {isSubmitting ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    className="spinner"
                                />
                                Submitting...
                            </div>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                <Send size={18} /> Submit Feedback
                            </div>
                        )}
                    </motion.button>
                </form>
            </motion.div>
        </motion.div>
    );
}
