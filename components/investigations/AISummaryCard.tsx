
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { SparklesIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

interface AISummaryCardProps {
    summary: string;
    flags?: string[];
    isLoading?: boolean;
}

export const AISummaryCard: React.FC<AISummaryCardProps> = ({ summary, flags = [], isLoading }) => {
    if (isLoading) {
        return (
            <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-900/10 animate-pulse">
                <CardContent className="p-4">
                    <div className="h-4 bg-purple-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-purple-200 rounded w-1/2"></div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-900/10">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100 flex items-center gap-2">
                    <SparklesIcon className="w-4 h-4 text-purple-600" />
                    AI Analysis
                </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {summary}
                </p>

                {flags.length > 0 && (
                    <div className="space-y-1 mt-3">
                        {flags.map((flag, i) => (
                            <div key={i} className="flex items-start gap-2 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded text-xs border border-amber-100 dark:border-amber-800">
                                <ExclamationTriangleIcon className="w-3 h-3 mt-0.5 shrink-0" />
                                <span>{flag}</span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
