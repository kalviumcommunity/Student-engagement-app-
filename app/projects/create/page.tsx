'use client';

import { useState, FormEvent } from 'react';
import { useAuth, getAuthHeaders } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { motion } from 'framer-motion';
import { FolderPlus, ArrowLeft } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Link from 'next/link';

export default function CreateProjectPage() {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');


    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const headers = {
                ...getAuthHeaders(user),
                'Content-Type': 'application/json',
            };

            const res = await fetch('/api/projects', {
                method: 'POST',
                headers,
                body: JSON.stringify({ title }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create project');
            }


            await res.json();
            // Redirect back to mentor dashboard and force reload to show new project
            window.location.href = '/dashboard/mentor';
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An error occurred during project creation');
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <ProtectedRoute allowedRoles={['MENTOR']}>
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
                <div className="max-w-2xl mx-auto pt-12">
                    <Link href="/dashboard/mentor">
                        <Button variant="ghost" size="sm" className="mb-6">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Dashboard
                        </Button>
                    </Link>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <Card>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                                    <FolderPlus className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">Create New Project</h1>
                                    <p className="text-slate-400 text-sm">Start a new project for your students</p>
                                </div>
                            </div>

                            {error && (
                                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                                    <p className="text-red-400 text-sm">{error}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <Input
                                    label="Project Title"
                                    placeholder="Enter project name..."
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                />

                                <div className="flex gap-3">
                                    <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isLoading}>
                                        Create Project
                                    </Button>
                                    <Link href="/dashboard/mentor">
                                        <Button type="button" variant="ghost" size="lg">
                                            Cancel
                                        </Button>
                                    </Link>
                                </div>
                            </form>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
