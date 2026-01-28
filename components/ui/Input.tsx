'use client';

import { InputHTMLAttributes, useState } from 'react';
import { motion } from 'framer-motion';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export default function Input({
    label,
    error,
    icon,
    className = '',
    type = 'text',
    ...props
}: InputProps) {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <div className="w-full">
            {label && (
                <motion.label
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="block text-sm font-medium text-slate-300 mb-2"
                >
                    {label}
                </motion.label>
            )}

            <div className="relative">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        {icon}
                    </div>
                )}

                <motion.input
                    whileFocus={{ scale: 1.01 }}
                    type={type}
                    className={`
            w-full px-4 py-3 ${icon ? 'pl-10' : ''}
            bg-slate-800/50 border rounded-lg
            text-white placeholder-slate-400
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
            ${error ? 'border-red-500' : isFocused ? 'border-purple-500' : 'border-slate-700'}
            ${className}
          `}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    {...props}
                />
            </div>

            {error && (
                <motion.p
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mt-1 text-sm text-red-400"
                >
                    {error}
                </motion.p>
            )}
        </div>
    );
}
