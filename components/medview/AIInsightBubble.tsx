import React from 'react';
import { SparklesIcon, ExclamationTriangleIcon, BoltIcon } from '@heroicons/react/24/outline';
import { cn } from '../../lib/utils';

interface AIInsightBubbleProps {
    type: 'auto-format' | 'missing-info' | 'generate' | 'insight';
    label?: string;
    onClick?: () => void;
    className?: string;
}

export const AIInsightBubble: React.FC<AIInsightBubbleProps> = ({ type, label, onClick, className }) => {
    let icon = <SparklesIcon className="w-3 h-3" />;
    let defaultLabel = 'Generate';
    // Unified AI Theme (Indigo)
    const aiStyles = "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-800 dark:hover:bg-indigo-900/40";

    switch (type) {
        case 'auto-format':
            icon = <BoltIcon className="w-3 h-3" />;
            defaultLabel = 'Auto-format';
            break;
        case 'missing-info':
            icon = <ExclamationTriangleIcon className="w-3 h-3" />;
            defaultLabel = 'Missing Info';
            break;
        case 'insight':
            icon = <SparklesIcon className="w-3 h-3" />;
            defaultLabel = 'Insight';
            break;
        case 'generate':
        default:
            icon = <SparklesIcon className="w-3 h-3" />;
            defaultLabel = 'Generate';
            break;
    }

    return (
        <button
            onClick={onClick}
            className={cn(
                "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border transition-colors",
                aiStyles,
                className
            )}
        >
            {icon}
            {label || defaultLabel}
        </button>
    );
};
