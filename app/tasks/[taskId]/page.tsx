'use client';

/**
 * ============================================
 * STUDENT TASK DETAILS PAGE (ANIMATED)
 * Tech Stack: Next.js App Router, TypeScript, CSS, Framer Motion
 * Design: Staggered Entrance, Completion Animation
 * ============================================
 */

import React, { useState, useEffect, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Calendar,
    User,
    Clock,
    Briefcase,
    AlertCircle,
    CheckCircle2,
    Send,
    MoreVertical
} from 'lucide-react';
import './TaskDetails.css';

// --- TYPE DEFINITIONS ---

interface Comment {
    id: string;
    author: string;
    text: string;
    date: string;
}

interface TaskDetails {
    id: string;
    projectId: string;
    projectName: string;
    title: string;
    description: string;
    dueDate: string;
    priority: 'Low' | 'Medium' | 'High';
    status: 'Todo' | 'Doing' | 'Done';
    mentorName: string;
    comments: Comment[];
}

// --- ANIMATION VARIANTS ---

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
};

// --- MAIN COMPONENT ---

interface PageProps {
    params: Promise<{ taskId: string }>;
}

export default function TaskDetailsPage({ params }: PageProps) {
    const resolvedParams = use(params);
    const taskId = resolvedParams.taskId;

    const [task, setTask] = useState<TaskDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    useEffect(() => {
        const fetchTaskDetails = async () => {
            try {
                setIsLoading(true);
                setError(null);
                await new Promise((resolve) => setTimeout(resolve, 800));

                const mockDatabase: Record<string, TaskDetails> = {
                    t1: {
                        id: 't1',
                        projectId: 'p1',
                        projectName: 'Web Engagement App',
                        title: 'User Research & Persona building',
                        description: 'Conduct deep-dive interviews with at least 5 students and 2 mentors to understand their daily challenges with engagement tracking. Create 3 distinct user personas based on the findings.',
                        dueDate: '2026-02-01',
                        priority: 'High',
                        status: 'Done',
                        mentorName: 'Sarah Connor',
                        comments: [
                            { id: 'c1', author: 'Sarah Connor', text: 'Please ensure you cover both undergraduate and postgraduate students.', date: '2026-01-15 10:30' },
                            { id: 'c2', author: 'Jane Smith (You)', text: 'I have scheduled the first three interviews for this Wednesday.', date: '2026-01-16 14:20' }
                        ]
                    },
                    t2: {
                        id: 't2',
                        projectId: 'p1',
                        projectName: 'Web Engagement App',
                        title: 'Initial Wireframes & Prototype',
                        description: 'Develop low-fidelity wireframes for the dashboard and the project details view. The focus should be on UX flow rather than visual polish.',
                        dueDate: '2026-02-15',
                        priority: 'Medium',
                        status: 'Doing',
                        mentorName: 'Sarah Connor',
                        comments: [
                            { id: 'c3', author: 'Sarah Connor', text: 'Make sure the navigation between the dashboard and projects is seamless.', date: '2026-01-20 09:00' }
                        ]
                    },
                    t3: {
                        id: 't3',
                        projectId: 'p1',
                        projectName: 'Web Engagement App',
                        title: 'Backend API Design',
                        description: 'Define the RESTful API endpoints required for the application, including authentication, project CRUD, and task management.',
                        dueDate: '2026-03-01',
                        priority: 'High',
                        status: 'Todo',
                        mentorName: 'Alan Turing',
                        comments: []
                    }
                };

                const foundTask = mockDatabase[taskId];
                if (foundTask) {
                    setTask(foundTask);
                } else {
                    throw new Error('Task not found.');
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load task details.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchTaskDetails();
    }, [taskId]);

    const handleMarkAsCompleted = async () => {
        if (!task) return;
        try {
            setIsUpdating(true);
            setError(null);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            setTask({ ...task, status: 'Done' });
            setSuccessMsg('Task successfully marked as completed!');
            setTimeout(() => setSuccessMsg(null), 3500);
        } catch (err) {
            setError('Failed to update task status. Please try again.');
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="loadingContainer">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="spinner"
                />
                <p>Fetching task details...</p>
            </div>
        );
    }

    if (error || !task) {
        return (
            <div className="errorContainer">
                <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
                <p className="errorText">{error || 'Task not found.'}</p>
                <a href="/dashboard/student" className="backBtn" style={{ marginTop: '1rem' }}>
                    Return to Dashboard
                </a>
            </div>
        );
    }

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="detailsContainer"
        >
            <motion.header variants={itemVariants} className="header">
                <a href={`/projects/${task.projectId}`} className="backBtn">
                    <ArrowLeft size={16} /> Back to Project
                </a>
                <div className="titleRow">
                    <h1 className="title">{task.title}</h1>
                    <span className={`badge ${task.status === 'Done' ? 'badgeDone' : task.status === 'Doing' ? 'badgeDoing' : 'badgeTodo'}`}>
                        {task.status === 'Done' ? <CheckCircle2 size={14} style={{ marginRight: '4px' }} /> : <Clock size={14} style={{ marginRight: '4px' }} />}
                        {task.status}
                    </span>
                </div>
            </motion.header>

            <motion.section variants={itemVariants} className="infoCard">
                <div className="descriptionSection">
                    <h3 className="descriptionTitle">Task Description</h3>
                    <p className="description">{task.description}</p>
                </div>

                <div className="metaGrid">
                    <div className="metaItem">
                        <span className="metaLabel">Priority</span>
                        <span className={`priorityBadge ${task.priority === 'High' ? 'priorityHigh' : task.priority === 'Medium' ? 'priorityMedium' : 'priorityLow'}`}>
                            <AlertCircle size={12} style={{ marginRight: '4px' }} />
                            {task.priority}
                        </span>
                    </div>
                    <div className="metaItem">
                        <span className="metaLabel">Due Date</span>
                        <span className="metaValue">
                            <Calendar size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                            {task.dueDate}
                        </span>
                    </div>
                    <div className="metaItem">
                        <span className="metaLabel">Project</span>
                        <span className="metaValue">
                            <Briefcase size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                            {task.projectName}
                        </span>
                    </div>
                    <div className="metaItem">
                        <span className="metaLabel">Mentor</span>
                        <span className="metaValue">
                            <User size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                            {task.mentorName}
                        </span>
                    </div>
                </div>
            </motion.section>

            <motion.div variants={itemVariants} className="actions">
                <button
                    onClick={handleMarkAsCompleted}
                    disabled={task.status === 'Done' || isUpdating}
                    className="completeBtn"
                >
                    {isUpdating ? 'Updating...' : task.status === 'Done' ? 'Completed' : 'Mark as Completed'}
                </button>

                <AnimatePresence>
                    {successMsg && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="successMsg"
                        >
                            <CheckCircle2 size={18} /> {successMsg}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            <motion.section variants={itemVariants} className="section">
                <div className="sectionHeader" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 className="sectionTitle" style={{ margin: 0, border: 'none', padding: 0 }}>Feedback & Comments</h2>
                    <MoreVertical size={20} color="#94a3b8" />
                </div>
                <div className="commentList">
                    <AnimatePresence>
                        {task.comments.length > 0 ? (
                            task.comments.map((comment, idx) => (
                                <motion.div
                                    key={comment.id}
                                    className="commentItem"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    whileHover={{ backgroundColor: '#fdfdfd' }}
                                >
                                    <div className="commentHeader">
                                        <span className="authorName">
                                            <div className="avatarPlaceholder" style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '50%',
                                                backgroundColor: '#e2e8f0',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginRight: '12px',
                                                fontSize: '0.75rem',
                                                fontWeight: 800
                                            }}>
                                                {comment.author.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            {comment.author}
                                        </span>
                                        <span className="commentDate">{comment.date}</span>
                                    </div>
                                    <p className="commentText" style={{ marginLeft: '44px' }}>{comment.text}</p>
                                </motion.div>
                            ))
                        ) : (
                            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <Send size={32} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                                <p>No comments or feedback yet.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.section>
        </motion.div>
    );
}
