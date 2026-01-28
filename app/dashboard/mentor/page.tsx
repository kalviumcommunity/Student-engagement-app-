'use client';

/**
 * ============================================
 * MENTOR DASHBOARD PAGE
 * High-Fidelity, Animated SaaS Experience
 * Tech Stack: Next.js App Router, TypeScript, Framer Motion, Lucide
 * ============================================
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Briefcase,
    CheckCircle2,
    Clock,
    ExternalLink,
    LogOut,
    Bell,
    Search,
    LayoutDashboard,
    ShieldCheck,
    Zap,
    MessageSquare
} from 'lucide-react';
import './MentorDashboard.css';

// --- TYPE DEFINITIONS ---

interface Project {
    id: string;
    name: string;
    description: string;
    studentCount: number;
}

interface Activity {
    id: string;
    studentName: string;
    action: string;
    date: string;
    type: 'project' | 'task' | 'feedback';
}

interface Analytics {
    totalProjects: number;
    totalStudents: number;
    activeTasks: number;
    completionRate: number;
}

// --- ANIMATION VARIANTS ---

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1, // Smooth sequence for all elements
        },
    },
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { type: 'spring', stiffness: 260, damping: 20 },
    },
};

// --- MAIN COMPONENT ---

export default function MentorDashboard() {
    // State management
    const [projects, setProjects] = useState<Project[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * Data Fetching Logic (Mocked)
     * Simulates fetching dashboard data on load
     */
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // JWT token from localStorage (ready for real backend)
                const token = localStorage.getItem('token');

                // Simulating API Latency
                await new Promise((resolve) => setTimeout(resolve, 1200));

                // Mock Analytics
                setAnalytics({
                    totalProjects: 6,
                    totalStudents: 15,
                    activeTasks: 42,
                    completionRate: 84
                });

                // Mock Projects
                setProjects([
                    {
                        id: 'p1',
                        name: 'Web Engagement App',
                        description: 'Building high-fidelity interactive dashboards for student tracking.',
                        studentCount: 4
                    },
                    {
                        id: 'p2',
                        name: 'AI Study Assistant',
                        description: 'Next-gen LLM integration for curriculum support.',
                        studentCount: 3
                    },
                    {
                        id: 'p3',
                        name: 'Campus Maps',
                        description: 'Indoor navigation and pathfinding optimization for university campus.',
                        studentCount: 5
                    },
                    {
                        id: 'p4',
                        name: 'Cloud Infrastructure',
                        description: 'Serverless deployment and monitoring for scale.',
                        studentCount: 3
                    }
                ]);

                // Mock Recent Activity
                setActivities([
                    { id: 'a1', studentName: 'Jane Smith', action: 'Submitted task: Final Wireframes', date: '2 hours ago', type: 'task' },
                    { id: 'a2', studentName: 'John Doe', action: 'Completed project: UX Research', date: '5 hours ago', type: 'project' },
                    { id: 'a3', studentName: 'Alice Johnson', action: 'Request feedback on: Database Schema', date: '1 day ago', type: 'feedback' },
                    { id: 'a4', studentName: 'Bob Brown', action: 'Joined project: AI Study Assistant', date: '2 days ago', type: 'project' }
                ]);

            } catch (err: any) {
                setError('Failed to load dashboard. Please try refreshing.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
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
                <p>Preparing your workspace...</p>
            </div>
        );
    }

    if (error || !analytics) {
        return (
            <div className="errorContainer">
                <ShieldCheck size={48} color="#ef4444" />
                <p className="errorText">{error}</p>
                <button onClick={() => window.location.reload()} className="viewBtn" style={{ marginTop: '1rem' }}>
                    Reload Dashboard
                </button>
            </div>
        );
    }

    return (
        <motion.main
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="dashboardContainer"
        >
            {/* Navbar Section */}
            <motion.nav variants={itemVariants} className="navbar">
                <div className="logo">CollabLearn</div>
                <div className="navRight">
                    <div className="searchBar" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Search projects..."
                            style={{ padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.875rem', width: '240px' }}
                        />
                    </div>
                    <motion.div whileHover={{ scale: 1.1 }} style={{ cursor: 'pointer', color: '#64748b' }}>
                        <Bell size={20} />
                    </motion.div>
                    <Link href="/feedback" style={{ display: 'flex', alignItems: 'center', color: '#64748b', textDecoration: 'none', marginRight: '1rem', fontSize: '0.875rem' }}>
                        <MessageSquare size={18} style={{ marginRight: '6px' }} />
                        Feedback
                    </Link>
                    <span className="welcomeText">Welcome back, Mentor!</span>
                    <Link href="/logout" className="logoutBtn">
                        <LogOut size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                        Logout
                    </Link>
                </div>
            </motion.nav>

            {/* Analytics Grid */}
            <motion.section variants={containerVariants} className="analyticsGrid">
                {[
                    { title: 'Total Projects', value: analytics.totalProjects, icon: <Briefcase size={22} />, color: '#eef2ff', iconColor: '#6366f1' },
                    { title: 'Active Students', value: analytics.totalStudents, icon: <Users size={22} />, color: '#f0fdf4', iconColor: '#22c55e' },
                    { title: 'Ongoing Tasks', value: analytics.activeTasks, icon: <Zap size={22} />, color: '#fff7ed', iconColor: '#f97316' },
                    { title: 'Completion Overall', value: `${analytics.completionRate}%`, icon: <CheckCircle2 size={22} />, color: '#fef2f2', iconColor: '#ef4444' }
                ].map((stat, idx) => (
                    <motion.div key={idx} variants={itemVariants} className="analyticCard">
                        <div className="cardIcon" style={{ backgroundColor: stat.color, color: stat.iconColor }}>
                            {stat.icon}
                        </div>
                        <span className="analyticTitle">{stat.title}</span>
                        <span className="analyticValue">{stat.value}</span>
                        <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.05 }}>
                            {stat.icon}
                        </div>
                    </motion.div>
                ))}
            </motion.section>

            {/* Main Content Layout */}
            <div className="dashboardContent">

                {/* Left Col: Projects List */}
                <motion.section variants={itemVariants} className="projectsSection">
                    <h2 className="sectionTitle">
                        <LayoutDashboard size={20} /> Your Projects
                    </h2>
                    <Link href="/projects/create" className="viewBtn" style={{ background: '#6366f1', color: '#fff', border: 'none', marginLeft: 'auto' }}>
                        + New Project
                    </Link>
                    <div className="projectList">
                        {projects.map((project) => (
                            <motion.div
                                key={project.id}
                                whileHover={{ scale: 1.01 }}
                                className="projectCard"
                            >
                                <div className="projectInfo">
                                    <h3>{project.name}</h3>
                                    <p>{project.description}</p>
                                    <div className="studentCount">
                                        <Users size={14} /> {project.studentCount} students assigned
                                    </div>
                                </div>
                                <Link href={`/projects/${project.id}`} className="viewBtn">
                                    View Details <ExternalLink size={14} style={{ marginLeft: '6px' }} />
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </motion.section>

                {/* Right Col: Activity Feed */}
                <motion.section variants={itemVariants} className="activitySection">
                    <h2 className="sectionTitle">
                        <Clock size={20} /> Recent Activity
                    </h2>
                    <div className="activityFeed">
                        <div className="activityList">
                            {activities.map((activity) => (
                                <div key={activity.id} className="activityItem">
                                    <div className="activityDot" style={{
                                        backgroundColor: activity.type === 'project' ? '#6366f1' : activity.type === 'task' ? '#22c55e' : '#f97316'
                                    }} />
                                    <div className="activityContent">
                                        <span className="studentName">{activity.studentName}</span>
                                        <p className="actionText">{activity.action}</p>
                                        <span className="activityDate">{activity.date}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.section>
            </div>
        </motion.main>
    );
}
