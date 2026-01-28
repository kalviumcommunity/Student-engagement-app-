'use client';

/**
 * ============================================
 * MENTOR PROJECT DETAILS & ANALYTICS PAGE
 * Tech Stack: Next.js App Router, TypeScript, CSS, Framer Motion
 * Design: High-Fidelity SaaS, Animated Grid, Tables
 * ============================================
 */

import React, { useState, useEffect, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Users,
    Plus,
    LayoutGrid,
    CheckCircle2,
    Calendar,
    ExternalLink,
    AlertCircle
} from 'lucide-react';
import './MentorProjectDetails.css';

// --- TYPE DEFINITIONS ---

interface Member {
    name: string;
    role: string;
    email: string;
}

interface ProjectDetails {
    projectId: string;
    projectName: string;
    description: string;
    createdAt: string;
    deadline: string;
    status: 'active' | 'completed';
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    members: Member[];
    progressPercentage: number;
}

// --- ANIMATION VARIANTS ---

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.12,
            delayChildren: 0.2
        }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { type: 'spring', stiffness: 260, damping: 20 }
    }
};

// --- MAIN COMPONENT ---

interface PageProps {
    params: Promise<{ projectId: string }>;
}

export default function MentorProjectPage({ params }: PageProps) {
    const resolvedParams = use(params);
    const projectId = resolvedParams.projectId;

    const [project, setProject] = useState<ProjectDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Mock API Fetching
    useEffect(() => {
        const fetchDetails = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Simulate network latency
                await new Promise(r => setTimeout(r, 1200));

                const mockData: Record<string, ProjectDetails> = {
                    'p1': {
                        projectId: 'p1',
                        projectName: 'Web Engagement App',
                        description: 'This project aims to create a highly interactive and responsive application for student engagement, utilizing modern web technologies and real-time data visualization.',
                        createdAt: 'Jan 15, 2026',
                        deadline: 'June 30, 2026',
                        status: 'active',
                        totalTasks: 45,
                        completedTasks: 32,
                        pendingTasks: 13,
                        progressPercentage: 71,
                        members: [
                            { name: 'Sarah Connor', role: 'Lead Developer', email: 'sarah@example.com' },
                            { name: 'John Doe', role: 'UI/UX Designer', email: 'john@example.com' },
                            { name: 'Alice Smith', role: 'Frontend Engineer', email: 'alice@example.com' },
                            { name: 'James Wilson', role: 'Backend Dev', email: 'james@example.com' }
                        ]
                    },
                    'p2': {
                        projectId: 'p2',
                        projectName: 'AI Study Assistant',
                        description: 'Developing a localized LLM-based assistant specifically tuned for curriculum support and student Q&A.',
                        createdAt: 'Jan 20, 2026',
                        deadline: 'Aug 15, 2026',
                        status: 'active',
                        totalTasks: 28,
                        completedTasks: 10,
                        pendingTasks: 18,
                        progressPercentage: 35,
                        members: [
                            { name: 'Alan Turing', role: 'AI Lead', email: 'alan@example.com' },
                            { name: 'Ada Lovelace', role: 'Python Developer', email: 'ada@example.com' }
                        ]
                    }
                };

                const foundProject = mockData[projectId] || mockData['p1'];
                setProject(foundProject);
            } catch (err: any) {
                setError(err.message || "Failed to load project details.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchDetails();
    }, [projectId]);

    if (isLoading) {
        return (
            <div className="loadingContainer">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="spinner"
                />
                <p>Fetching project intelligence...</p>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="errorContainer">
                <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
                <p className="errorText">{error || 'Project not found.'}</p>
                <a href="/dashboard/mentor" className="actionBtn btnGhost" style={{ marginTop: '1.5rem' }}>
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
            className="mentorDetailsContainer"
        >
            {/* Header Section */}
            <motion.header variants={itemVariants} className="mentorHeader">
                <div className="headerLeft">
                    <a href="/dashboard/mentor" className="btnOutline actionBtn" style={{ padding: '0.5rem 1rem', marginBottom: '1.5rem', border: 'none' }}>
                        <ArrowLeft size={16} /> Back
                    </a>
                    <h1 className="projectName">{project.projectName}</h1>
                    <div className="statusBadge">
                        <CheckCircle2 size={14} style={{ marginRight: '6px' }} />
                        {project.status}
                    </div>
                </div>
                <div className="deadlineBox">
                    <span className="metaLabel">Project Deadline</span>
                    <span className="metaValue">
                        <Calendar size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                        {project.deadline}
                    </span>
                </div>
            </motion.header>

            {/* Dashboard Grid */}
            <div className="mentorGrid">
                {/* Project Info Card */}
                <motion.section variants={itemVariants} className="mentorCard">
                    <h2 className="cardTitle">Project Overview</h2>
                    <p className="projectDesc">{project.description}</p>
                    <div className="taskStats">
                        <div className="statItem">
                            <span className="statLabel">Total Tasks</span>
                            <span className="statValue">{project.totalTasks}</span>
                        </div>
                        <div className="statItem">
                            <span className="statLabel" style={{ color: '#22c55e' }}>Completed</span>
                            <span className="statValue" style={{ color: '#22c55e' }}>{project.completedTasks}</span>
                        </div>
                        <div className="statItem">
                            <span className="statLabel" style={{ color: '#f59e0b' }}>Pending</span>
                            <span className="statValue" style={{ color: '#f59e0b' }}>{project.pendingTasks}</span>
                        </div>
                    </div>
                </motion.section>

                {/* Analytics Section */}
                <motion.section variants={itemVariants} className="mentorCard">
                    <h2 className="cardTitle">Project Health & Analytics</h2>
                    <div className="heroProgress">
                        <div className="progressLabelRow">
                            <span>Overall Development Progress</span>
                            <span>{project.progressPercentage}%</span>
                        </div>
                        <div className="rail">
                            <motion.div
                                className="fill"
                                initial={{ width: 0 }}
                                animate={{ width: `${project.progressPercentage}%` }}
                                transition={{ duration: 1.5, ease: "circOut", delay: 0.5 }}
                            />
                        </div>
                    </div>
                    <div className="miniStatsRow">
                        <div className="miniCard">
                            <span className="miniLabel">Total Members</span>
                            <span className="miniValue">{project.members.length}</span>
                        </div>
                        <div className="miniCard">
                            <span className="miniLabel">Task Ratio</span>
                            <span className="miniValue">{project.completedTasks}/{project.totalTasks}</span>
                        </div>
                    </div>
                </motion.section>

                {/* Members List Section */}
                <motion.section variants={itemVariants} className="mentorCard" style={{ gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 className="cardTitle" style={{ margin: 0 }}>Team Members</h2>
                        <button className="btnGhost actionBtn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>
                            <Users size={14} /> Manage Team
                        </button>
                    </div>
                    <div className="tableWrapper">
                        <table className="membersTable">
                            <thead>
                                <tr>
                                    <th>Full Name</th>
                                    <th>Project Role</th>
                                    <th>Email Address</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {project.members.map((member, idx) => (
                                    <motion.tr
                                        key={idx}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.6 + (idx * 0.1) }}
                                    >
                                        <td className="memberName">{member.name}</td>
                                        <td className="memberRole">{member.role}</td>
                                        <td className="memberEmail">{member.email}</td>
                                        <td>
                                            <button className="btnGhost" style={{ padding: '0.3rem', borderRadius: '8px' }}>
                                                <ExternalLink size={14} color="#64748b" />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.section>
            </div>

            {/* Action Footer */}
            <motion.footer variants={itemVariants} className="mentorActions">
                <a href="/dashboard/mentor" className="btnOutline actionBtn">
                    ← Back to Dashboard
                </a>
                <div className="primaryButtonGroup">
                    <button className="btnGhost actionBtn">
                        <Users size={18} /> View Student List
                    </button>
                    <button className="btnSolid actionBtn">
                        <Plus size={18} /> Assign New Task
                    </button>
                </div>
            </motion.footer>
        </motion.div>
    );
}
