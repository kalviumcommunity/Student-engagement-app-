'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
    children: ReactNode;
    className?: string;
    hover?: boolean;
    glass?: boolean;
    onClick?: () => void;
}

export default function Card({
    children,
    className = '',
    hover = true,
    glass = true,
    onClick,
}: CardProps) {
    const baseStyles = 'rounded-xl p-6 transition-all duration-300';
    const glassStyles = glass
        ? 'glass shadow-glass border border-white/10'
        : 'bg-slate-800/50 border border-slate-700/50';
    const hoverStyles = hover
        ? 'hover:shadow-2xl hover:-translate-y-1 cursor-pointer'
        : '';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            whileHover={hover ? { y: -4 } : {}}
            className={`${baseStyles} ${glassStyles} ${hoverStyles} ${className}`}
            onClick={onClick}
        >
            {children}
        </motion.div>
    );
}
