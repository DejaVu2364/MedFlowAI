import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { SparklesIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { cn } from '../../lib/utils';

interface AISummaryCardProps {
    summary: string | string[];
    onRefresh: () => void;
    isLoading?: boolean;
    className?: string;
}

export const AISummaryCard: React.FC<AISummaryCardProps> = ({ summary, onRefresh, isLoading, className }) => {
    return (
        <Card className={cn("bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/30 dark:to-background border-indigo-100 dark:border-indigo-900", className)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5 text-indigo-600" />
                    <CardTitle className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">AI 24-Hour Summary</CardTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isLoading} className="h-8 w-8 p-0">
                    <ArrowPathIcon className={cn("w-4 h-4", isLoading && "animate-spin")} />
                </Button>
            </CardHeader>
            <CardContent>
                {Array.isArray(summary) ? (
                    <ul className="space-y-2">
                        {summary.map((point, i) => (
                            <li key={i} className="flex gap-2 text-sm text-foreground/80 leading-relaxed">
                                <span className="text-primary mt-1.5">•</span>
                                <span>{point}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-foreground/80 leading-relaxed">{summary}</p>
                )}
            </CardContent>
        </Card>
    );
};
