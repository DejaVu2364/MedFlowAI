import React from 'react';
import { TriageLevel } from '../../types';
import { cn } from '../../lib/utils';

interface TriageBadgeProps {
    level: TriageLevel | string;
    className?: string;
}

export const TriageBadge: React.FC<TriageBadgeProps> = ({ level, className }) => {
    // Map to specific Tailwind classes for pills
    // bg-red-600 text-white, rounded-full, no borders
    const levelStyles: Record<string, string> = {
        Red: 'bg-red-600 text-white shadow-sm',
        Yellow: 'bg-yellow-500 text-black shadow-sm',
        Green: 'bg-green-600 text-white shadow-sm',
        None: 'bg-gray-400 text-white',
    };

    // Normalize input (case-insensitive fallback if needed)
    const normalizedLevel = Object.keys(levelStyles).find(k => k.toLowerCase() === level?.toLowerCase()) || 'None';
    const style = levelStyles[normalizedLevel];

    return (
        <span className={cn(
            "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center min-w-[60px]",
            style,
            className
        )}>
            {level || 'None'}
        </span>
    );
};
