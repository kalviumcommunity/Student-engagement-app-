'use client';

/**
 * ============================================
 * MENTOR CREATE TASK PAGE
 * Tech Stack: Next.js App Router, TypeScript, CSS, Framer Motion
 * Design: High-Fidelity SaaS, Animated Form, Dynamic Fetching
 * ============================================
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Plus
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import './CreateTask.css';

// --- TYPE DEFINITIONS ---

interface Project {
    id: string;
    name: string;
}

interface Member {
    memberId: string;
    name: string;
    role: 'STUDENT' | 'MENTOR';
}

interface TaskForm {
    title: string;
    description: string;
    projectId: string;
    assignedTo: string;
    dueDate: string;
    priority: 'Low' | 'Medium' | 'High';
}

// --- ANIMATION VARIANTS ---

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { type: 'spring' as const, stiffness: 260, damping: 20 }
    }
};

// --- MAIN COMPONENT ---

export default function CreateTaskPage() {
    const router = useRouter();

    // Form State
    const [formData, setFormData] = useState<TaskForm>({
        title: '',
        description: '',
        projectId: '',
        assignedTo: '',
        dueDate: '',
        priority: 'Medium'
    });

    // Data State
    const [projects, setProjects] = useState<Project[]>([]);
    const [students, setStudents] = useState<Member[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Feedback State
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // 1. Fetch Projects on Load
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                setIsLoadingData(true);

                // Fetch real projects from API
                const response = await fetch('/api/projects', {
                    headers: {
                        'x-user-id': localStorage.getItem('userId') || '',
                        'x-user-role': localStorage.getItem('userRole') || ''
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch projects');
                }

                const data = await response.json();

                // Map API response to Project interface
                const projectsList: Project[] = data.map((p: { id: string; title: string }) => ({
                    id: p.id,
                    name: p.title
                }));

                setProjects(projectsList);
            } catch {
                setErrorMessage("Failed to load projects. Please refresh the page.");
            } finally {
                setIsLoadingData(false);
            }
        };
        fetchProjects();
    }, []);

    // 2. Fetch Students when Project Changes
    useEffect(() => {
        if (!formData.projectId) {
            setStudents([]);
            return;
        }

        const fetchStudents = async () => {
            try {
                // Fetch project members from API
                const response = await fetch(`/api/projects/${formData.projectId}/members`, {
                    headers: {
                        'x-user-id': localStorage.getItem('userId') || '',
                        'x-user-role': localStorage.getItem('userRole') || ''
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch members');
                }

                const data = await response.json();

                // Extract members array and filter for students only
                const allMembers: Member[] = data.members.map((m: { id: string; name: string; role: 'STUDENT' | 'MENTOR' }) => ({
                    memberId: m.id,
                    name: m.name,
                    role: m.role
                }));

                // Filter only students as per requirements
                const projectStudents = allMembers.filter(m => m.role === 'STUDENT');

                setStudents(projectStudents);
                // Reset assignedTo if the previous student is not in the new project
                setFormData(prev => ({ ...prev, assignedTo: '' }));
            } catch {
                console.error("Failed to fetch students");
                setStudents([]);
            }
        };

        fetchStudents();
    }, [formData.projectId]);

    // 3. Handle Form Changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // 4. Handle Submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Simple Validation
        if (!formData.title || !formData.projectId || !formData.assignedTo || !formData.dueDate) {
            setErrorMessage("Please fill in all required fields.");
            return;
        }

        try {
            setIsSubmitting(true);
            setErrorMessage(null);

            // Send POST request to create task
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': localStorage.getItem('userId') || '',
                    'x-user-role': localStorage.getItem('userRole') || ''
                },
                body: JSON.stringify({
                    title: formData.title,
                    projectId: formData.projectId,
                    assignedToId: formData.assignedTo
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create task');
            }

            setSuccessMessage("Task created successfully! Redirecting...");

            // Clear form
            setFormData({
                title: '',
                description: '',
                projectId: '',
                assignedTo: '',
                dueDate: '',
                priority: 'Medium'
            });

            // Redirect after 2 seconds
            setTimeout(() => {
                router.push('/dashboard/mentor');
            }, 2000);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to create task. Please try again.";
            setErrorMessage(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            className="createTaskContainer"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <div className="header">
                <motion.a variants={itemVariants} href="/dashboard/mentor" className="backBtn">
                    <ArrowLeft size={16} /> Back to Dashboard
                </motion.a>
                <motion.h1 variants={itemVariants} className="title">Create New Task</motion.h1>
                <motion.p variants={itemVariants} className="subtitle">Assign a new responsibility to one of your students.</motion.p>
            </div>

            <motion.div variants={itemVariants} className="formCard">
                <AnimatePresence mode="wait">
                    {successMessage && (
                        <motion.div
                            key="success"
                            className="message success"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <CheckCircle2 size={18} /> {successMessage}
                        </motion.div>
                    )}
                    {errorMessage && (
                        <motion.div
                            key="error"
                            className="message error"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <AlertCircle size={18} /> {errorMessage}
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="formGrid">
                    {/* Task Title */}
                    <div className="formField">
                        <label className="label">Task Title</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g. Implement User Authentication"
                            className="input"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="formField">
                        <label className="label">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Provide details about what needs to be done..."
                            className="textarea"
                        />
                    </div>

                    {/* Project & Student Row */}
                    <div className="formRow">
                        <div className="formField">
                            <label className="label">Project</label>
                            <div style={{ position: 'relative' }}>
                                <select
                                    name="projectId"
                                    value={formData.projectId}
                                    onChange={handleChange}
                                    className="select"
                                    style={{ width: '100%' }}
                                    required
                                >
                                    <option value="">Select Project</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                                {isLoadingData && (
                                    <Loader2 className="spinner" size={14} style={{ position: 'absolute', right: '35px', top: '12px', animation: 'spin 1s linear infinite' }} />
                                )}
                            </div>
                        </div>

                        <div className="formField">
                            <label className="label">Assign To</label>
                            <select
                                name="assignedTo"
                                value={formData.assignedTo}
                                onChange={handleChange}
                                className="select"
                                disabled={!formData.projectId}
                                required
                            >
                                <option value="">Select Student</option>
                                {students.map(s => (
                                    <option key={s.memberId} value={s.memberId}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Deadline & Priority Row */}
                    <div className="formRow">
                        <div className="formField">
                            <label className="label">Due Date</label>
                            <input
                                type="date"
                                name="dueDate"
                                value={formData.dueDate}
                                onChange={handleChange}
                                className="input"
                                required
                            />
                        </div>

                        <div className="formField">
                            <label className="label">Priority</label>
                            <select
                                name="priority"
                                value={formData.priority}
                                onChange={handleChange}
                                className="select"
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <motion.button
                        type="submit"
                        className="submitBtn"
                        disabled={isSubmitting}
                        whileTap={{ scale: 0.98 }}
                    >
                        {isSubmitting ? (
                            <>
                                <div className="btnSpinner"></div>
                                Creating Task...
                            </>
                        ) : (
                            <>
                                <Plus size={18} /> Create Task
                            </>
                        )}
                    </motion.button>
                </form>
            </motion.div>
        </motion.div>
    );
}
