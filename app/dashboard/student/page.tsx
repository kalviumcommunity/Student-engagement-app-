'use client';

/**
 * ============================================
 * STUDENT DASHBOARD (ANIMATED)
 * Tech Stack: Next.js App Router, TypeScript, CSS, Framer Motion
 * Design: Staggered Entrance, Hover Effects, Clean SaaS
 * ============================================
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Projector,
    CheckSquare,
    MessageSquare,
    TrendingUp,
    LayoutDashboard,
    LogOut,
    ChevronRight,
    Clock
} from 'lucide-react';
import './StudentDashboard.css';

// --- TYPE DEFINITIONS ---

interface Project {
    id: string;
    name: string;
    description: string;
    status: 'In Progress' | 'Completed' | 'Pending';
}

interface Task {
    id: string;
    title: string;
    dueDate: string;
    status: 'Todo' | 'Doing' | 'Done';
}

interface Feedback {
    id: string;
    mentorName: string;
    comment: string;
    date: string;
}

interface Analytics {
    totalProjects: number;
    totalTasks: number;
    feedbackCount: number;
    completionRate: number;
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

const cardVariants = {
    hidden: { scale: 0.95, opacity: 0 },
    visible: {
        scale: 1,
        opacity: 1,
        transition: { type: 'spring', stiffness: 300, damping: 24 },
    },
};

// --- MAIN COMPONENT ---

export default function StudentDashboard() {
    // State for data
    const [projects, setProjects] = useState<Project[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [feedback, setFeedback] = useState<Feedback[]>([]);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);

    // UI State
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * Data Fetching Logic (Mocked)
     */
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const token = localStorage.getItem('token');

                // Simulating API Latency
                await new Promise((resolve) => setTimeout(resolve, 1500));

                const mockProjects: Project[] = [
                    { id: 'p1', name: 'Web Engagement App', description: 'Interactive dashboard for students.', status: 'In Progress' },
                    { id: 'p2', name: 'AI Study Assistant', description: 'Bot to help students with questions.', status: 'Pending' },
                    { id: 'p3', name: 'Campus Maps', description: 'Mobile app for campus navigation.', status: 'Completed' },
                ];

                const mockTasks: Task[] = [
                    { id: 't1', title: 'Complete Signup UI', dueDate: '2026-02-01', status: 'Done' },
                    { id: 't2', title: 'Connect to Database', dueDate: '2026-02-05', status: 'Doing' },
                    { id: 't3', title: 'Write Unit Tests', dueDate: '2026-02-10', status: 'Todo' },
                ];

                const mockFeedback: Feedback[] = [
                    { id: 'f1', mentorName: 'Sarah Connor', comment: 'Great job on the initial layout! Clean and responsive.', date: '2026-01-18' },
                    { id: 'f2', mentorName: 'James Bond', comment: 'Make sure to validate all input fields on the signup page.', date: '2026-01-19' },
                    { id: 'f3', mentorName: 'Alan Turing', comment: 'The state management logic is very efficient. Keep it up.', date: '2026-01-20' },
                ];

                setProjects(mockProjects);
                setTasks(mockTasks);
                setFeedback(mockFeedback);
                setAnalytics({
                    totalProjects: mockProjects.length,
                    totalTasks: mockTasks.length,
                    feedbackCount: mockFeedback.length,
                    completionRate: 75,
                });

            } catch (err) {
                setError('Failed to fetch dashboard data. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (isLoading) {
        return (
            <div className="loadingContainer">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="spinner"
                />
                <p>Prepping your workspace...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="errorContainer">
                <p className="errorText">{error}</p>
                <button onClick={() => window.location.reload()} className="viewBtn">Try Again</button>
            </div>
        );
    }

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="dashboardContainer"
        >
            {/* Header / Navbar */}
            <motion.nav variants={itemVariants} className="navbar">
                <div className="logo">
                    <LayoutDashboard size={24} style={{ marginRight: '0.5rem' }} />
                    CollabLearn
                </div>
                <div className="welcomeSection">
                    <Link href="/feedback" className="logoutBtn" style={{ marginRight: '1rem', background: 'none', color: '#64748b', border: 'none' }}>
                        <MessageSquare size={18} style={{ marginRight: '0.4rem' }} />
                        My Feedback
                    </Link>
                    <span className="welcomeText">Welcome back, Student!</span>
                    <Link href="/logout" className="logoutBtn">
                        <LogOut size={18} style={{ marginRight: '0.4rem' }} />
                        Logout
                    </Link>
                </div>
            </motion.nav>

            {/* Analytics Cards */}
            <div className="analyticsGrid">
                {[
                    { title: 'Total Projects', value: analytics?.totalProjects, color: '#2563eb', icon: <Projector size={20} /> },
                    { title: 'Total Tasks', value: analytics?.totalTasks, color: '#8b5cf6', icon: <CheckSquare size={20} /> },
                    { title: 'Feedback Received', value: analytics?.feedbackCount, color: '#ec4899', icon: <MessageSquare size={20} /> },
                    { title: 'Completion %', value: `${analytics?.completionRate}%`, color: '#10b981', icon: <TrendingUp size={20} /> },
                ].map((card, idx) => (
                    <motion.div
                        key={idx}
                        variants={cardVariants}
                        whileHover={{ y: -5, transition: { duration: 0.2 } }}
                        className="analyticsCard"
                        style={{ borderColor: card.color }}
                    >
                        <div className="cardHeader" style={{ display: 'flex', justifyContent: 'space-between', color: card.color }}>
                            <div className="cardTitle">{card.title}</div>
                            {card.icon}
                        </div>
                        <div className="cardNumber">{card.value}</div>
                    </motion.div>
                ))}
            </div>

            {/* Main Grid Content */}
            <div className="contentGrid">

                {/* Projects List */}
                <motion.section variants={itemVariants} className="section">
                    <div className="sectionTitle">
                        Your Projects
                        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>Recent</span>
                    </div>
                    <div className="list">
                        <AnimatePresence>
                            {projects.map((project, idx) => (
                                <motion.div
                                    key={project.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    whileHover={{ x: 5 }}
                                    className="listItem"
                                >
                                    <div className="itemInfo">
                                        <h4>{project.name}</h4>
                                        <p>{project.description}</p>
                                        <span className={`badge ${project.status === 'Completed' ? 'badgeCompleted' : project.status === 'In Progress' ? 'badgeProgress' : 'badgePending'}`}>
                                            {project.status}
                                        </span>
                                    </div>
                                    <Link href={`/projects/${project.id}`} className="viewBtn">
                                        View <ChevronRight size={14} />
                                    </Link>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </motion.section>

                {/* Tasks & Feedback Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Tasks List */}
                    <motion.section variants={itemVariants} className="section">
                        <div className="sectionTitle">Your Tasks</div>
                        <div className="list">
                            {tasks.map((task, idx) => (
                                <motion.div
                                    key={task.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="listItem"
                                >
                                    <div className="itemInfo">
                                        <h4 style={{ fontSize: '0.95rem' }}>{task.title}</h4>
                                        <p style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <Clock size={12} /> {task.dueDate}
                                        </p>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: task.status === 'Done' ? '#10b981' : '#f59e0b' }}>
                                            {task.status}
                                        </span>
                                    </div>
                                    <Link href={`/tasks/${task.id}`} className="viewBtn" style={{ background: '#f1f5f9', color: '#475569' }}>
                                        View
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </motion.section>

                    {/* Feedback Preview */}
                    <motion.section variants={itemVariants} className="section">
                        <div className="sectionTitle">Recent Feedback</div>
                        <div className="feedbackList">
                            {feedback.map((item, idx) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: idx * 0.2 }}
                                    className="feedbackItem"
                                >
                                    <div className="feedbackHeader">
                                        <span className="mentorName">{item.mentorName}</span>
                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{item.date}</span>
                                    </div>
                                    <p className="feedbackText">"{item.comment}"</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.section>

                </div>
            </div>
        </motion.div>
    );
}
