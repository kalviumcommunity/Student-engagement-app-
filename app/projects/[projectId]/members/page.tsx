'use client';

/**
 * ============================================
 * MENTOR PROJECT MEMBERS MANAGEMENT PAGE
 * Tech Stack: Next.js App Router, TypeScript, CSS, Framer Motion
 * Design: Admin Dashboard, Animated Table, Confirm Modals
 * ============================================
 */

import React, { useState, useEffect, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Trash2,
    X,
    User,
    Mail,
    Shield,
    AlertTriangle,
    CheckCircle2
} from 'lucide-react';
import './MembersManagement.css';

// --- TYPE DEFINITIONS ---

interface Member {
    memberId: string;
    name: string;
    role: 'Student' | 'Mentor';
    email: string;
}

interface PageProps {
    params: Promise<{ projectId: string }>;
}

// --- ANIMATION VARIANTS ---

const rowVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.1, duration: 0.4, ease: "easeOut" }
    }),
    exit: { opacity: 0, x: -20, transition: { duration: 0.3 } }
};

const modalVariants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 25 } },
    exit: { scale: 0.9, opacity: 0, transition: { duration: 0.2 } }
};

const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
};

// --- MAIN COMPONENT ---

export default function MembersManagementPage({ params }: PageProps) {
    // Standard Next.js way to handle dynamic route params in client components
    const resolvedParams = use(params);
    const projectId = resolvedParams.projectId;

    const [members, setMembers] = useState<Member[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal State
    const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Toast State
    const [showSuccess, setShowSuccess] = useState(false);

    // 1. Load Members on Page Load
    useEffect(() => {
        const fetchMembers = async () => {
            try {
                setIsLoading(true);
                // Simulate network latency
                await new Promise(r => setTimeout(r, 1200));

                // Mock response for GET /api/projects/:projectId/members
                const mockMembers: Member[] = [
                    { memberId: 'm1', name: 'Nikhil Reddy', role: 'Student', email: 'nikhil@example.com' },
                    { memberId: 'm2', name: 'Sarah Connor', role: 'Mentor', email: 'sarah@example.com' },
                    { memberId: 'm3', name: 'John Doe', role: 'Student', email: 'john@example.com' },
                    { memberId: 'm4', name: 'Alice Smith', role: 'Student', email: 'alice@example.com' },
                    { memberId: 'm5', name: 'James Wilson', role: 'Mentor', email: 'james@example.com' },
                ];

                setMembers(mockMembers);
            } catch (err) {
                setError("Failed to fetch project members. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchMembers();
    }, [projectId]);

    // 2. Handle Delete (Mock API Call)
    const handleDelete = async () => {
        if (!memberToDelete) return;

        try {
            setIsDeleting(true);
            // Simulate DELETE /api/projects/:projectId/members/:memberId
            await new Promise(r => setTimeout(r, 800));

            // Remove from local state
            setMembers(prev => prev.filter(m => m.memberId !== memberToDelete.memberId));

            // Show Success UI
            setMemberToDelete(null);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (err) {
            alert("Failed to delete member. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="membersContainer">
                <div className="loadingContainer">
                    <div className="spinner"></div>
                    <p>Loading project members...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="membersContainer">
            {/* Header */}
            <header className="header">
                <a href={`/projects/${projectId}`} className="backBtn">
                    <ArrowLeft size={16} /> Back to Project
                </a>
                <h1 className="title">Project Members</h1>
                <span className="projectIdLabel">Project ID: {projectId}</span>
            </header>

            {/* Members Table */}
            <div className="tableCard">
                <table className="membersTable">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Role</th>
                            <th>Email</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <AnimatePresence>
                            {members.map((member, index) => (
                                <motion.tr
                                    key={member.memberId}
                                    variants={rowVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    custom={index}
                                >
                                    <td className="memberName">
                                        <User size={14} style={{ marginRight: '8px', verticalAlign: 'middle', color: '#94a3b8' }} />
                                        {member.name}
                                    </td>
                                    <td>
                                        <span className={`memberRole ${member.role === 'Student' ? 'roleStudent' : 'roleMentor'}`}>
                                            <Shield size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                            {member.role}
                                        </span>
                                    </td>
                                    <td className="memberEmail">
                                        <Mail size={14} style={{ marginRight: '8px', verticalAlign: 'middle', color: '#94a3b8' }} />
                                        {member.email}
                                    </td>
                                    <td>
                                        <button
                                            className="deleteBtn"
                                            onClick={() => setMemberToDelete(member)}
                                        >
                                            <Trash2 size={14} /> Remove
                                        </button>
                                    </td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                    </tbody>
                </table>
                {members.length === 0 && !isLoading && (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                        No members found in this project.
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {memberToDelete && (
                    <motion.div
                        className="modalOverlay"
                        variants={overlayVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <motion.div
                            className="modalContent"
                            variants={modalVariants}
                        >
                            <div className="modalIcon">
                                <AlertTriangle size={32} />
                            </div>
                            <h2 className="modalTitle">Remove Member?</h2>
                            <p className="modalText">
                                Are you sure you want to remove <strong>{memberToDelete.name}</strong> from the project? This action cannot be undone.
                            </p>
                            <div className="modalActions">
                                <button
                                    className="modalBtn cancelBtn"
                                    onClick={() => setMemberToDelete(null)}
                                    disabled={isDeleting}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="modalBtn confirmDeleteBtn"
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? 'Removing...' : 'Confirm Delete'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Success Success Toast */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        className="successToast"
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                    >
                        <CheckCircle2 size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                        Member removed successfully!
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
