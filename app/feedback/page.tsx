'use client';

/**
 * ============================================
 * STUDENT FEEDBACK LIST PAGE
 * High-Fidelity, Animated SaaS Experience
 * Tech Stack: Next.js App Router, TypeScript, Framer Motion
 * ============================================
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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

const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { type: 'spring', stiffness: 260, damping: 20 },
    },
};

// --- MAIN COMPONENT ---

export default function FeedbackListPage() {
    // State management
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * Data Fetching Logic (Mocked)
     * Fetches all feedback for the student on mount
     */
    useEffect(() => {
        const fetchAllFeedback = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // JWT token from localStorage for future API integration
                const token = localStorage.getItem('token');

                // Simulating API Latency
                await new Promise((resolve) => setTimeout(resolve, 1200));

                // Mock Database Retrieval
                const mockData: Feedback[] = [
                    {
                        id: 'f1',
                        mentorName: 'Sarah Connor',
                        projectName: 'Web Engagement App',
                        comment: 'Great job on the initial layout! The attention to responsiveness and the clean aesthetic is really impressive. Keep pushing on the accessibility details.',
                        date: '2026-01-18'
                    },
                    {
                        id: 'f2',
                        mentorName: 'James Bond',
                        projectName: 'Web Engagement App',
                        comment: 'The JWT implementation looks solid, but make sure you are also handling token refresh logic on the client side to avoid unexpected logouts.',
                        date: '2026-01-19'
                    },
                    {
                        id: 'f3',
                        mentorName: 'Alan Turing',
                        projectName: 'AI Study Assistant',
                        comment: 'The state management logic using React hooks is very efficient. I recommend exploring React Query if you plan to scale the data fetching.',
                        date: '2026-01-20'
                    },
                    {
                        id: 'f4',
                        mentorName: 'Grace Hopper',
                        projectName: 'Campus Maps',
                        comment: 'The pathfinding algorithm optimization you implemented significantly improved the performance on mobile devices. Excellent work!',
                        date: '2025-12-15'
                    }
                ];

                setFeedbacks(mockData);

            } catch (err: any) {
                setError('Failed to fetch feedback. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllFeedback();
    }, []);

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
                <Link href="/dashboard/student" className="backBtn">
                    <ArrowLeft size={18} /> Back to Dashboard
                </Link>
                <h1 className="title">Your Feedback</h1>
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
                                    "{item.comment}"
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
