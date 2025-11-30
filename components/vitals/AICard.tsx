import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { SparklesIcon } from '@heroicons/react/24/outline';

export const AICard: React.FC<{ insights: string[] }> = ({ insights }) => {
    return (
        <Card className="bg-indigo-50/50 dark:bg-indigo-950/10 border-indigo-100 dark:border-indigo-900 shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center gap-2">
                <SparklesIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <CardTitle className="text-sm font-semibold text-indigo-900 dark:text-indigo-300">AI Insights</CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2">
                    {insights.map((insight, i) => (
                        <li key={i} className="text-xs text-indigo-800 dark:text-indigo-200 leading-relaxed flex gap-2">
                            <span className="block w-1 h-1 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                            {insight}
                        </li>
                    ))}
                </ul>
                <div className="mt-3 pt-2 border-t border-indigo-200/50 dark:border-indigo-800/50">
                    <p className="text-[10px] text-indigo-600/70 dark:text-indigo-400/70 font-medium flex items-center gap-1">
                        <span className="uppercase tracking-wider">Safety:</span> Verify clinically before action.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};
