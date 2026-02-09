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
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion, Variants } from 'framer-motion';
import {
    Users,
    Briefcase,
    CheckCircle2,
    Clock,
    ExternalLink,
    LogOut,
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

interface ProjectData {
    id: string;
    title: string;
    createdAt: string;
}

interface TaskData {
    id: string;
    title: string;
    status: string;
    createdAt: string;
    updatedAt: string;
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

const itemVariants: Variants = {
    hidden: {
        y: 20,
        opacity: 0,
    },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 10,
        },
    },
};

// --- MAIN COMPONENT ---

export default function MentorDashboard(): React.ReactNode {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    // State management
    const [projects, setProjects] = useState<Project[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Role-based access control
    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/login');
            } else if (user.role !== 'MENTOR') {
                router.push('/dashboard/student');
            }
        }
    }, [user, authLoading, router]);

    /**
     * Data Fetching Logic (Real API Calls)
     * Fetches dashboard data from backend APIs
     */
    useEffect(() => {
        const fetchDashboardData = async () => {
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
                const [projectsRes, tasksRes] = await Promise.all([
                    fetch('/api/projects', { headers }),
                    fetch('/api/tasks', { headers }),
                ]);

                // Check for errors
                if (!projectsRes.ok || !tasksRes.ok) {
                    throw new Error('Failed to fetch dashboard data');
                }

                // Parse responses
                const projectsData = await projectsRes.json();
                const tasksData = await tasksRes.json();

                // Transform projects data to match component interface
                const transformedProjects: Project[] = projectsData.map((p: ProjectData) => ({
                    id: p.id,
                    name: p.title,
                    description: `Project created on ${new Date(p.createdAt).toLocaleDateString()}`,
                    studentCount: 0, // Would need to fetch from project members API
                }));

                // Calculate analytics from real data
                const completedTasks = tasksData.filter((t: TaskData) => t.status === 'DONE').length;
                const totalTasks = tasksData.length;
                const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                setAnalytics({
                    totalProjects: projectsData.length,
                    totalStudents: 0, // Would need separate API endpoint
                    activeTasks: tasksData.filter((t: TaskData) => t.status === 'IN_PROGRESS').length,
                    completionRate: completionRate
                });

                setProjects(transformedProjects);

                // Transform recent activity from tasks
                const recentActivity: Activity[] = tasksData.slice(0, 5).map((t: TaskData) => ({
                    id: t.id,
                    studentName: 'Student', // Would need to fetch user names
                    action: `Task: ${t.title} - ${t.status}`,
                    date: new Date(t.updatedAt).toLocaleString(),
                    type: 'task'
                }));

                setActivities(recentActivity);

            } catch (err) {
                console.error('Mentor dashboard fetch error:', err);
                setError('Failed to load dashboard. Please try refreshing.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
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
                <div className="logo">
                    <LayoutDashboard size={24} style={{ marginRight: '0.5rem' }} />
                    CollabLearn
                </div>
                <div className="navRight">
                    <div className="searchBar" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Search projects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.875rem', width: '240px' }}
                        />
                    </div>
                    <Link href="/feedback" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#6366f1', color: 'white', borderRadius: '10px', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>
                        <MessageSquare size={18} />
                        Team Feedback
                    </Link>
                    <span className="welcomeText">Welcome back, {user?.name || 'Mentor'}!</span>
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
                        {projects
                            .filter(project =>
                                project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                project.description.toLowerCase().includes(searchQuery.toLowerCase())
                            )
                            .map((project) => (
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
