'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, AlertCircle, Calendar, FileText, UserCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getAuthHeaders } from '@/contexts/AuthContext';
import './AssignTask.css';

interface Student {
    id: string;
    name: string;
    email: string;
}

interface PageProps {
    params: Promise<{ projectId: string }>;
}

export default function AssignTaskPage({ params }: PageProps) {
    const resolvedParams = use(params);
    const projectId = resolvedParams.projectId;
    const router = useRouter();
    const { user } = useAuth();

    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [assignedToId, setAssignedToId] = useState('');
    const [dueDate, setDueDate] = useState('');

    // Fetch project members (students only)
    useEffect(() => {
        const fetchMembers = async () => {
            if (!user) return;

            try {
                setIsLoading(true);
                const headers = getAuthHeaders(user);

                // Fetch current project members
                const membersRes = await fetch(`/api/projects/${projectId}/members`, { headers });
                if (!membersRes.ok) throw new Error('Failed to fetch members');
                const membersData = await membersRes.json();

                // Filter to only show students
                const studentMembers = (membersData.members || []).filter(
                    (m: { role: string }) => m.role === 'STUDENT'
                );

                setStudents(studentMembers);
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'An error occurred fetching members');
            } finally {
                setIsLoading(false);
            }
        };

        fetchMembers();
    }, [user, projectId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) return;

        // Validation
        if (!title.trim()) {
            setError('Task title is required');
            return;
        }

        if (!assignedToId) {
            setError('Please select a team member to assign this task');
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);
            setSuccessMessage(null);

            const headers = {
                ...getAuthHeaders(user),
                'Content-Type': 'application/json',
            };

            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim() || undefined,
                    projectId,
                    assignedToId,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create task');
            }

            const newTask = await res.json();
            setSuccessMessage(`Task "${newTask.title}" created successfully!`);

            // Redirect back to project page after 1.5 seconds
            setTimeout(() => {
                router.push(`/projects/${projectId}`);
            }, 1500);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An error occurred assigning task');
        } finally {
            setIsSubmitting(false);
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
                <p>Loading project members...</p>
            </div>
        );
    }

    return (
        <div className="assignTaskContainer">
            <div className="contentWrapper">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pageHeader"
                >
                    <button
                        onClick={() => router.push(`/projects/${projectId}`)}
                        className="backButton"
                    >
                        <ArrowLeft size={18} />
                        Back to Project
                    </button>
                    <h1 className="pageTitle">
                        <CheckCircle2 size={32} />
                        Assign New Task
                    </h1>
                    <p className="pageSubtitle">
                        Create and assign a task to a team member
                    </p>
                </motion.div>

                {/* Success Message */}
                {successMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="alertSuccess"
                    >
                        <CheckCircle2 size={20} />
                        <span>{successMessage}</span>
                    </motion.div>
                )}

                {/* Error Message */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="alertError"
                    >
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </motion.div>
                )}

                {/* Task Form */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="formCard"
                >
                    <form onSubmit={handleSubmit}>
                        {/* Task Title */}
                        <div className="formGroup">
                            <label htmlFor="title" className="formLabel">
                                <FileText size={18} />
                                Task Title *
                            </label>
                            <input
                                type="text"
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Complete homepage design"
                                className="formInput"
                                required
                            />
                        </div>

                        {/* Task Description */}
                        <div className="formGroup">
                            <label htmlFor="description" className="formLabel">
                                <FileText size={18} />
                                Description (Optional)
                            </label>
                            <textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Add more details about this task..."
                                className="formTextarea"
                                rows={4}
                            />
                        </div>

                        {/* Assign To */}
                        <div className="formGroup">
                            <label htmlFor="assignedTo" className="formLabel">
                                <UserCheck size={18} />
                                Assign To *
                            </label>
                            {students.length === 0 ? (
                                <div className="emptyState">
                                    No students in this project. Add members first.
                                </div>
                            ) : (
                                <select
                                    id="assignedTo"
                                    value={assignedToId}
                                    onChange={(e) => setAssignedToId(e.target.value)}
                                    className="formSelect"
                                    required
                                >
                                    <option value="">Select a team member</option>
                                    {students.map((student) => (
                                        <option key={student.id} value={student.id}>
                                            {student.name} ({student.email})
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Due Date */}
                        <div className="formGroup">
                            <label htmlFor="dueDate" className="formLabel">
                                <Calendar size={18} />
                                Due Date (Optional)
                            </label>
                            <input
                                type="date"
                                id="dueDate"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="formInput"
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="formActions">
                            <button
                                type="button"
                                onClick={() => router.push(`/projects/${projectId}`)}
                                className="btnSecondary"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || students.length === 0}
                                className="btnPrimary"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="buttonSpinner"></div>
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 size={18} />
                                        Create Task
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
