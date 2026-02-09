'use client';

/**
 * ============================================
 * FEEDBACK LIST PAGE (Students & Mentors)
 * High-Fidelity, Animated SaaS Experience
 * Tech Stack: Next.js App Router, TypeScript, Framer Motion
 * ============================================
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Variants } from "framer-motion";
import { useAuth, getAuthHeaders } from '@/contexts/AuthContext';

import {
    ArrowLeft,
    MessageSquare,
    User,
    Briefcase,
    AlertCircle,
    Inbox
} from 'lucide-react';
import './FeedbackList.css';

// --- TYPE DEFINITIONS ---

interface Feedback {
    id: string;
    mentorName: string;
    projectName: string;
    comment: string;
    date: string;
}

// --- ANIMATION VARIANTS ---

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15, // Delay between each card's entrance
        },
    },
};

const cardVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { type: 'spring' as const, stiffness: 260, damping: 20 },
    },
};

// --- MAIN COMPONENT ---

export default function FeedbackPage() {
    const { user } = useAuth();
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * Data Fetching Logic (Real API)
     * Fetches all feedback for the student/mentor from backend
     */
    useEffect(() => {
        const fetchAllFeedback = async () => {
            if (!user) {
                setError('Not authenticated');
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                const headers = getAuthHeaders(user);

                // Fetch feedback from API
                const res = await fetch('/api/feedback', { headers });

                if (!res.ok) {
                    throw new Error('Failed to fetch feedback');
                }

                const feedbackData = await res.json();

                // Transform API data to match component interface
                const transformedFeedback: Feedback[] = feedbackData.map((f: { id: string; comment?: string; createdAt: string }) => ({
                    id: f.id,
                    mentorName: 'Peer', // We'd need to fetch user names separately
                    projectName: 'Project', // We'd need to fetch project names separately
                    comment: f.comment || 'No comment provided',
                    date: new Date(f.createdAt).toLocaleDateString()
                }));

                setFeedbacks(transformedFeedback);

            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'Failed to fetch feedback. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllFeedback();
    }, [user]);

    // --- RENDERING HELPERS ---

    if (isLoading) {
        return (
            <div className="loadingContainer">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="spinner"
                />
                <p>Loading your feedback...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="errorContainer">
                <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
                <p className="errorText">{error}</p>
                <button onClick={() => window.location.reload()} className="backBtn" style={{ marginTop: '1rem', cursor: 'pointer', background: 'none', border: 'none' }}>
                    ← Try Again
                </button>
            </div>
        );
    }

    return (
        <motion.main
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="feedbackContainer"
        >
            {/* Header Section */}
            <motion.header variants={cardVariants} className="header">
                <Link
                    href={user?.role === 'MENTOR' ? '/dashboard/mentor' : '/dashboard/student'}
                    className="backBtn"
                >
                    <ArrowLeft size={18} /> Back to Dashboard
                </Link>
                <h1 className="title">
                    {user?.role === 'MENTOR' ? 'Team Feedback' : 'Your Feedback'}
                </h1>
            </motion.header>

            {/* Feedback List Section */}
            <motion.div className="feedbackList">
                <AnimatePresence>
                    {feedbacks.length > 0 ? (
                        feedbacks.map((item) => (
                            <motion.div
                                key={item.id}
                                variants={cardVariants}
                                whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                className="feedbackCard"
                            >
                                <div className="cardHeader">
                                    <div className="mentorInfo">
                                        <div className="avatar">
                                            {item.mentorName.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <span className="mentorName">
                                                <User size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                                                {item.mentorName}
                                            </span>
                                            <span className="projectName">
                                                <Briefcase size={12} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                                                {item.projectName}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="date">{item.date}</span>
                                </div>
                                <p className="feedbackContent">
                                    <MessageSquare size={16} style={{ display: 'inline', marginRight: '10px', opacity: 0.5, verticalAlign: 'top', marginTop: '4px' }} />
                                    &quot;{item.comment}&quot;
                                </p>
                            </motion.div>
                        ))
                    ) : (
                        /* Empty State */
                        <motion.div variants={cardVariants} className="emptyState">
                            <Inbox size={64} color="#e2e8f0" />
                            <h3 className="emptyTitle">No feedback yet</h3>
                            <p>Keep working on your projects and check back soon!</p>
                            <Link href="/dashboard/student" className="backBtn" style={{ marginTop: '1.5rem', color: '#6366f1' }}>
                                Go build something →
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.main>
    );
}
