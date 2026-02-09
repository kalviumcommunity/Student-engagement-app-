'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, MessageSquare, Users, CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getAuthHeaders } from '@/contexts/AuthContext';
import './GiveFeedback.css';

interface Project {
    id: string;
    title: string;
}

interface Teammate {
    id: string;
    name: string;
    email: string;
}

export default function GiveFeedbackPage() {
    const router = useRouter();
    const { user } = useAuth();

    const [projects, setProjects] = useState<Project[]>([]);
    const [teammates, setTeammates] = useState<Teammate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Form state
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [selectedTeammateId, setSelectedTeammateId] = useState('');
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [comment, setComment] = useState('');

    // Fetch user's projects
    useEffect(() => {
        const fetchProjects = async () => {
            if (!user) return;

            try {
                setIsLoading(true);
                const headers = getAuthHeaders(user);

                const res = await fetch('/api/projects', { headers });
                if (!res.ok) throw new Error('Failed to fetch projects');

                const data = await res.json();
                setProjects(data);
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'An error occurred fetching projects');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProjects();
    }, [user]);

    // Fetch teammates when project is selected
    useEffect(() => {
        const fetchTeammates = async () => {
            if (!selectedProjectId || !user) {
                setTeammates([]);
                return;
            }

            try {
                const headers = getAuthHeaders(user);

                const res = await fetch(`/api/projects/${selectedProjectId}/members`, { headers });
                if (!res.ok) throw new Error('Failed to fetch team members');

                const data = await res.json();

                // Filter out current user and only show students
                const filteredTeammates = (data.members || [])
                    .filter((m: { id: string; role: string }) => m.id !== user.id && m.role === 'STUDENT');

                setTeammates(filteredTeammates);
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'An error occurred fetching teammates');
            }
        };

        fetchTeammates();
    }, [selectedProjectId, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) return;

        // Validation
        if (!selectedProjectId) {
            setError('Please select a project');
            return;
        }

        if (!selectedTeammateId) {
            setError('Please select a teammate');
            return;
        }

        if (rating === 0) {
            setError('Please provide a rating');
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

            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    projectId: selectedProjectId,
                    toUserId: selectedTeammateId,
                    rating,
                    comment: comment.trim() || undefined,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to submit feedback');
            }

            setSuccessMessage('Feedback submitted successfully!');

            // Reset form
            setSelectedProjectId('');
            setSelectedTeammateId('');
            setRating(0);
            setComment('');

            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
                router.push('/dashboard/student');
            }, 2000);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An error occurred submitting feedback');
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
                <p>Loading projects...</p>
            </div>
        );
    }

    return (
        <div className="feedbackContainer">
            <div className="contentWrapper">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pageHeader"
                >
                    <button
                        onClick={() => router.push('/dashboard/student')}
                        className="backButton"
                    >
                        <ArrowLeft size={18} />
                        Back to Dashboard
                    </button>
                    <h1 className="pageTitle">
                        <MessageSquare size={32} />
                        Give Peer Feedback
                    </h1>
                    <p className="pageSubtitle">
                        Share your thoughts and rate your teammates&apos; contributions
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

                {/* Feedback Form */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="formCard"
                >
                    <form onSubmit={handleSubmit}>
                        {/* Project Selector */}
                        <div className="formGroup">
                            <label htmlFor="project" className="formLabel">
                                <Users size={18} />
                                Select Project *
                            </label>
                            {projects.length === 0 ? (
                                <div className="emptyState">
                                    You are not assigned to any projects yet.
                                </div>
                            ) : (
                                <select
                                    id="project"
                                    value={selectedProjectId}
                                    onChange={(e) => {
                                        setSelectedProjectId(e.target.value);
                                        setSelectedTeammateId(''); // Reset teammate when project changes
                                    }}
                                    className="formSelect"
                                    required
                                >
                                    <option value="">Choose a project</option>
                                    {projects.map((project) => (
                                        <option key={project.id} value={project.id}>
                                            {project.title}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Teammate Selector */}
                        {selectedProjectId && (
                            <div className="formGroup">
                                <label htmlFor="teammate" className="formLabel">
                                    <Users size={18} />
                                    Select Teammate *
                                </label>
                                {teammates.length === 0 ? (
                                    <div className="emptyState">
                                        No other teammates in this project.
                                    </div>
                                ) : (
                                    <select
                                        id="teammate"
                                        value={selectedTeammateId}
                                        onChange={(e) => setSelectedTeammateId(e.target.value)}
                                        className="formSelect"
                                        required
                                    >
                                        <option value="">Choose a teammate</option>
                                        {teammates.map((teammate) => (
                                            <option key={teammate.id} value={teammate.id}>
                                                {teammate.name} ({teammate.email})
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        )}

                        {/* Star Rating */}
                        {selectedTeammateId && (
                            <div className="formGroup">
                                <label className="formLabel">
                                    <Star size={18} />
                                    Rating *
                                </label>
                                <div className="starRating">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <motion.button
                                            key={star}
                                            type="button"
                                            whileHover={{ scale: 1.2 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHoveredRating(star)}
                                            onMouseLeave={() => setHoveredRating(0)}
                                            className="starButton"
                                        >
                                            <Star
                                                size={32}
                                                fill={(hoveredRating || rating) >= star ? '#fbbf24' : 'none'}
                                                stroke={(hoveredRating || rating) >= star ? '#fbbf24' : '#cbd5e1'}
                                                strokeWidth={2}
                                            />
                                        </motion.button>
                                    ))}
                                </div>
                                {rating > 0 && (
                                    <p className="ratingText">
                                        {rating === 5 ? 'Excellent!' : rating === 4 ? 'Great!' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Needs Improvement'}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Comment */}
                        {selectedTeammateId && (
                            <div className="formGroup">
                                <label htmlFor="comment" className="formLabel">
                                    <MessageSquare size={18} />
                                    Comment (Optional)
                                </label>
                                <textarea
                                    id="comment"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Share your thoughts about your teammate's work..."
                                    className="formTextarea"
                                    rows={4}
                                />
                            </div>
                        )}

                        {/* Submit Button */}
                        {selectedTeammateId && (
                            <div className="formActions">
                                <button
                                    type="button"
                                    onClick={() => router.push('/dashboard/student')}
                                    className="btnSecondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || rating === 0}
                                    className="btnPrimary"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="buttonSpinner"></div>
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={18} />
                                            Submit Feedback
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
