'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, UserPlus, Users, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getAuthHeaders } from '@/contexts/AuthContext';
import './AddMembers.css';

interface Student {
    id: string;
    name: string;
    email: string;
}

interface Member {
    id: string;
    name: string;
}

interface PageProps {
    params: Promise<{ projectId: string }>;
}

export default function AddMembersPage({ params }: PageProps) {
    const resolvedParams = use(params);
    const projectId = resolvedParams.projectId;
    const router = useRouter();
    const { user } = useAuth();

    const [students, setStudents] = useState<Student[]>([]);
    const [currentMembers, setCurrentMembers] = useState<Member[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [addingUserId, setAddingUserId] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Fetch students and current members
    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            try {
                setIsLoading(true);
                const headers = getAuthHeaders(user);

                // Fetch all students
                const studentsRes = await fetch('/api/users?role=STUDENT', { headers });
                if (!studentsRes.ok) throw new Error('Failed to fetch students');
                const studentsData = await studentsRes.json();

                // Fetch current project members
                const membersRes = await fetch(`/api/projects/${projectId}/members`, { headers });
                if (!membersRes.ok) throw new Error('Failed to fetch members');
                const membersData = await membersRes.json();

                setStudents(studentsData);
                setCurrentMembers(membersData.members || []);
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'An error occurred fetching data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user, projectId]);

    const handleAddMember = async (studentId: string) => {
        if (!user) return;

        try {
            setAddingUserId(studentId);
            setError(null);
            setSuccessMessage(null);

            const headers = {
                ...getAuthHeaders(user),
                'Content-Type': 'application/json',
            };

            const res = await fetch(`/api/projects/${projectId}/members`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ userId: studentId }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to add member');
            }

            const newMember = await res.json();

            // Update current members list
            setCurrentMembers([...currentMembers, newMember.user]);
            setSuccessMessage(`Successfully added ${newMember.user.name} to the project!`);

            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An error occurred adding member');
        } finally {
            setAddingUserId(null);
        }
    };

    const isAlreadyMember = (studentId: string) => {
        return currentMembers.some(m => m.id === studentId);
    };

    if (isLoading) {
        return (
            <div className="loadingContainer">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="spinner"
                />
                <p>Loading students...</p>
            </div>
        );
    }

    return (
        <div className="addMembersContainer">
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
                        <UserPlus size={32} />
                        Add Members to Project
                    </h1>
                    <p className="pageSubtitle">
                        Select students to add to your project
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

                {/* Current Members Count */}
                <div className="statsCard">
                    <Users size={20} />
                    <span className="statsText">Current Members: {currentMembers.length}</span>
                </div>

                {/* Students List */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="studentsCard"
                >
                    <div className="cardHeader">
                        <h2 className="cardTitle">Available Students</h2>
                    </div>

                    <div className="studentsList">
                        {students.length === 0 ? (
                            <div className="emptyState">
                                No students found in the system
                            </div>
                        ) : (
                            students.map((student, index) => {
                                const isMember = isAlreadyMember(student.id);
                                const isAdding = addingUserId === student.id;

                                return (
                                    <motion.div
                                        key={student.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="studentItem"
                                    >
                                        <div className="studentInfo">
                                            <h3 className="studentName">{student.name}</h3>
                                            <p className="studentEmail">{student.email}</p>
                                        </div>

                                        {isMember ? (
                                            <div className="memberBadge">
                                                <CheckCircle2 size={18} />
                                                <span>Already Member</span>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleAddMember(student.id)}
                                                disabled={isAdding}
                                                className="addButton"
                                            >
                                                {isAdding ? (
                                                    <>
                                                        <div className="buttonSpinner"></div>
                                                        Adding...
                                                    </>
                                                ) : (
                                                    <>
                                                        <UserPlus size={18} />
                                                        Add to Project
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
