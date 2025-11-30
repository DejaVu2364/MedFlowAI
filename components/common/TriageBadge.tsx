import React from 'react';
import { TriageLevel } from '../../types';
import { cn } from '../../lib/utils';

interface TriageBadgeProps {
    level: TriageLevel | string;
    className?: string;
}

export const TriageBadge: React.FC<TriageBadgeProps> = ({ level, className }) => {
    const levelStyles: Record<string, string> = {
        Red: 'bg-red-500 text-white',
        Yellow: 'bg-yellow-500 text-white',
        Green: 'bg-green-500 text-white',
        None: 'bg-gray-500 text-white',
    };

    // Fallback for unknown levels
    const style = levelStyles[level] || 'bg-gray-500 text-white';

    return (
        <span className={cn(
            "rounded-full px-2 py-0.5 text-xs font-semibold inline-flex items-center justify-center",
            style,
            className
        )}>
            {level}
        </span>
    );
};
