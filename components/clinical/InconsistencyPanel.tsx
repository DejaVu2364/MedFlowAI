
import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../lib/utils';

interface InconsistencyPanelProps {
    inconsistencies: string[];
    onItemClick?: (item: string) => void;
}

export const InconsistencyPanel: React.FC<InconsistencyPanelProps> = ({ inconsistencies, onItemClick }) => {
    const [expanded, setExpanded] = useState(false);

    if (!inconsistencies || inconsistencies.length === 0) return null;

    return (
        <div className="mb-6 border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/30 rounded-lg overflow-hidden transition-all">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between p-3 text-red-700 dark:text-red-400 hover:bg-red-100/50 dark:hover:bg-red-900/20 transition-colors"
            >
                <div className="flex items-center gap-2 font-medium">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{inconsistencies.length} Potential Inconsistencies Found</span>
                </div>
                <div className="flex items-center gap-2 text-xs opacity-80">
                    {expanded ? 'Collapse' : 'Click to view'}
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
            </button>

            {expanded && (
                <div className="px-3 pb-3 space-y-2">
                    {inconsistencies.map((item, index) => (
                        <div
                            key={index}
                            onClick={() => onItemClick?.(item)}
                            className="flex items-start gap-2 p-2 rounded-md bg-white dark:bg-zinc-900/50 border border-red-100 dark:border-red-900/20 text-sm text-red-600 dark:text-red-300 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                        >
                            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            <span>{item}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
