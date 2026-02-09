'use client';

/**
 * ============================================
 * *STUDENT DASHBOARD (ANIMATED)
 * *Tech Stack: Next.js App Router, TypeScript, CSS, Framer Motion
 * *Design: Staggered Entrance, Hover Effects, Clean SaaS
 * ============================================
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
    Projector,
    CheckSquare,
    MessageSquare,
    TrendingUp,
    LogOut,
    Clock,
    Search,
    Bell
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
    fromUser: string;
    project: string;
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

const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { type: 'spring', stiffness: 300, damping: 24 },
    },
};

const cardVariants: Variants = {
    hidden: { scale: 0.95, opacity: 0 },
    visible: {
        scale: 1,
        opacity: 1,
        transition: { type: 'spring', stiffness: 300, damping: 24 },
    },
};

// --- MAIN COMPONENT ---

export default function StudentDashboard() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    // State for data
    const [projects, setProjects] = useState<Project[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // UI State
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Role-based access control
    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/login');
            } else if (user.role !== 'STUDENT') {
                router.push('/dashboard/mentor');
            }
        }
    }, [user, authLoading, router]);

    /**
     * Data Fetching Logic (Real API Calls)
     */
    useEffect(() => {
        const fetchData = async () => {
            if (!user) return; // Wait for user to be loaded

            try {
                setIsLoading(true);
                setError(null);

                // Prepare auth headers
                const headers = {
                    'x-user-id': user.id,
                    'x-user-role': user.role,
                };

                // Fetch all data in parallel
                const [projectsRes, tasksRes, feedbackRes] = await Promise.all([
                    fetch('/api/projects', { headers }),
                    fetch('/api/tasks', { headers }),
                    fetch('/api/feedback', { headers }),
                ]);

                // Check for errors
                if (!projectsRes.ok || !tasksRes.ok || !feedbackRes.ok) {
                    throw new Error('Failed to fetch dashboard data');
                }

                // Parse responses
                const projectsData = await projectsRes.json();
                const tasksData = await tasksRes.json();
                const feedbackData = await feedbackRes.json();

                // Transform projects data to match component interface
                const transformedProjects: Project[] = projectsData.map((p: { id: string; title: string; createdAt: string }) => {
                    // Get all tasks for this project
                    const projectTasks = tasksData.filter((t: { projectId: string; status: string }) => t.projectId === p.id);
                    const totalTasks = projectTasks.length;
                    const completedTasks = projectTasks.filter((t: { projectId: string; status: string }) => t.status === 'DONE').length;

                    // Determine status based on task completion
                    let status: 'In Progress' | 'Completed' | 'Not Started';
                    if (totalTasks === 0) {
                        status = 'Not Started';
                    } else if (completedTasks === totalTasks) {
                        status = 'Completed';
                    } else {
                        status = 'In Progress';
                    }

                    return {
                        id: p.id,
                        name: p.title,
                        description: `Project created on ${new Date(p.createdAt).toLocaleDateString()}`,
                        status,
                    };
                });

                // Transform tasks data to match component interface
                const transformedTasks: Task[] = tasksData.map((t: any) => ({
                    id: t.id,
                    title: t.title,
                    dueDate: new Date(t.createdAt).toLocaleDateString(),
                    status: t.status === 'TODO' ? 'Todo' : t.status === 'IN_PROGRESS' ? 'Doing' : 'Done',
                }));

                // Transform feedback data to match component interface
                const transformedFeedback: Feedback[] = feedbackData.map((f: { id: string; fromUser?: { name?: string }; project?: { title?: string }; comment?: string; createdAt: string }) => ({
                    id: f.id,
                    fromUser: f.fromUser?.name || 'Unknown User',
                    project: f.project?.title || 'Unknown Project',
                    comment: f.comment || 'No comment provided',
                    date: new Date(f.createdAt).toLocaleDateString(),
                }));

                setProjects(transformedProjects);
                setTasks(transformedTasks);
                setFeedbacks(transformedFeedback);
                setAnalytics({
                    totalProjects: transformedProjects.length,
                    totalTasks: transformedTasks.length,
                    feedbackCount: transformedFeedback.length,
                    completionRate: tasksData.filter((t: { status: string }) => t.status === 'DONE').length > 0
                        ? Math.round(((tasksData as { status: string }[]).filter((t: { status: string }) => t.status === 'DONE').length / tasksData.length) * 100)
                        : 0,
                });

            } catch (err) {
                console.error('Dashboard fetch error:', err);
                setError('Failed to fetch dashboard data. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user]);

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
            {/* Navbar Section */}
            <motion.nav variants={itemVariants} className="navbar">
                <div className="logo">CollabLearn</div>
                <div className="navRight">
                    <div className="searchBar" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.875rem', width: '200px' }}
                        />
                    </div>
                    <motion.div whileHover={{ scale: 1.1 }} style={{ cursor: 'pointer', color: '#64748b' }}>
                        <Bell size={20} />
                    </motion.div>
                    <Link href="/give-feedback" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#6366f1', color: 'white', borderRadius: '10px', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>
                        <MessageSquare size={18} />
                        Give Feedback
                    </Link>
                    <Link href="/feedback" style={{ display: 'flex', alignItems: 'center', color: '#64748b', textDecoration: 'none', marginRight: '1rem', fontSize: '0.875rem' }}>
                        <MessageSquare size={18} style={{ marginRight: '6px' }} />
                        My Feedback
                    </Link>
                    <span className="welcomeText">Welcome back, {user?.name || 'Student'}!</span>
                    <Link href="/logout" className="logoutBtn">
                        <LogOut size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
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
                    <div className="sectionTitle">Your Projects</div>
                    <div className="list">
                        <AnimatePresence>
                            {projects
                                .filter(project =>
                                    searchQuery === '' ||
                                    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    project.description.toLowerCase().includes(searchQuery.toLowerCase())
                                )
                                .map((project, idx) => (
                                    <motion.div
                                        key={project.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="listItem"
                                    >
                                        <div className="itemInfo">
                                            <h4 style={{ fontSize: '0.95rem' }}>{project.name}</h4>
                                            <p>{project.description}</p>
                                            <span className={`badge ${project.status === 'Completed' ? 'badgeCompleted' : project.status === 'In Progress' ? 'badgeProgress' : 'badgePending'}`}>
                                                {project.status}
                                            </span>
                                        </div>
                                        <Link href={`/projects/${project.id}`} className="viewBtn">
                                            View
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

                    {/* Feedback Section */}
                    <motion.section variants={itemVariants} className="section">
                        <div className="sectionTitle">Recent Feedback</div>
                        <div className="list">
                            <AnimatePresence>
                                {feedbacks.map((item: Feedback, idx: number) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="feedbackItem"
                                    >
                                        <div className="feedbackHeader">
                                            <span className="mentorName">{item.fromUser}</span>
                                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{item.project}</span>
                                        </div>
                                        <p className="feedbackText">&quot;{item.comment}&quot;</p>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </motion.section>

                </div>
            </div>
        </motion.div>
    );
}
