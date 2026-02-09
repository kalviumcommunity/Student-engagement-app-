'use client';

/**
 * ============================================
 * MENTOR PROJECT DETAILS & ANALYTICS PAGE
 * Tech Stack: Next.js App Router, TypeScript, CSS, Framer Motion
 * Design: High-Fidelity SaaS, Animated Grid, Tables
 * ============================================
 */

import React, { useState, useEffect, use } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Users,
    Plus,
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

    // Fetch real project data from API
    useEffect(() => {
        const fetchDetails = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Get user from localStorage for auth headers
                const userStr = localStorage.getItem('user');
                if (!userStr) {
                    setError('Not authenticated');
                    setIsLoading(false);
                    return;
                }

                const user = JSON.parse(userStr);
                const headers = {
                    'x-user-id': user.id,
                    'x-user-role': user.role,
                };

                // Fetch project data
                const projectRes = await fetch('/api/projects', { headers });
                if (!projectRes.ok) {
                    throw new Error('Failed to fetch projects');
                }

                const projects = await projectRes.json();
                const currentProject = projects.find((p: { id: string }) => p.id === projectId);

                if (!currentProject) {
                    setError('Project not found');
                    setIsLoading(false);
                    return;
                }

                // Fetch tasks for this project
                const tasksRes = await fetch('/api/tasks', { headers });
                const tasks = tasksRes.ok ? await tasksRes.json() : [];
                const projectTasks = tasks.filter((t: { projectId: string }) => t.projectId === projectId);

                // Fetch project members
                const membersRes = await fetch(`/api/projects/${projectId}/members`, { headers });
                const membersData = membersRes.ok ? await membersRes.json() : { members: [] };
                const projectMembers = membersData.members || [];

                // Transform members to match component interface
                // Filter to only show students (exclude mentor)
                const transformedMembers: Member[] = projectMembers
                    .filter((m: { role: string }) => m.role === 'STUDENT')
                    .map((m: { name?: string; email?: string }) => ({
                        name: m.name || 'Unknown',
                        role: 'Student',
                        email: m.email || 'No email'
                    }));

                // Calculate task statistics
                const totalTasks = projectTasks.length;
                const completedTasks = projectTasks.filter((t: { status: string }) => t.status === 'DONE').length;
                const pendingTasks = totalTasks - completedTasks;
                const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                // Transform to match component interface
                const projectDetails: ProjectDetails = {
                    projectId: currentProject.id,
                    projectName: currentProject.title,
                    description: `Project created on ${new Date(currentProject.createdAt).toLocaleDateString()}`,
                    createdAt: new Date(currentProject.createdAt).toLocaleDateString(),
                    deadline: 'Not set', // API doesn't provide deadline
                    status: 'active',
                    totalTasks,
                    completedTasks,
                    pendingTasks,
                    progressPercentage,
                    members: transformedMembers
                };

                setProject(projectDetails);
            } catch (err: unknown) {
                console.error('Project detail fetch error:', err);
                setError(err instanceof Error ? err.message : "Failed to load project details.");
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
                <motion.section variants={itemVariants} className="mentorCard" id="team-members-section" style={{ gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 className="cardTitle" style={{ margin: 0 }}>Team Members</h2>
                        <a
                            href={`/projects/${projectId}/add-members`}
                            className="btnGhost actionBtn"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', textDecoration: 'none' }}
                        >
                            <Users size={14} /> Add Members
                        </a>
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
                    <button
                        className="btnGhost actionBtn"
                        onClick={() => {
                            const teamSection = document.querySelector('.mentorCard');
                            if (teamSection) {
                                teamSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                        }}
                    >
                        <Users size={18} /> View Student List
                    </button>
                    <a
                        href={`/projects/${projectId}/assign-task`}
                        className="btnSolid actionBtn"
                        style={{ textDecoration: 'none' }}
                    >
                        <Plus size={18} /> Assign New Task
                    </a>
                </div>
            </motion.footer>
        </motion.div>
    );
}
