import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { SparklesIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { cn } from '../../lib/utils';

export interface AIResponseData {
    type: 'structured';
    patientSnapshot?: {
        name: string;
        age: number;
        gender: string;
        triage: string;
    };
    keyFindings: string[];
    suggestedReviews: string[];
    quickActions: { label: string; action: string }[];
}

interface AIResponseCardProps {
    data: AIResponseData;
    onAction: (action: string) => void;
}

export const AIResponseCard: React.FC<AIResponseCardProps> = ({ data, onAction }) => {
    return (
        <Card className="bg-white/90 dark:bg-gray-900/70 shadow-sm rounded-2xl border-border/50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300 w-full max-w-md">
            <CardHeader className="bg-indigo-50/50 dark:bg-indigo-900/20 px-4 py-3 border-b border-indigo-100/50 dark:border-indigo-800/50 flex flex-row items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center shadow-sm">
                    <SparklesIcon className="h-4 w-4 text-white" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-300">MedFlow AI</h4>
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">Clinical Assistant</p>
                </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
                {data.patientSnapshot && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg border border-border/50">
                        <span className="font-semibold text-foreground">{data.patientSnapshot.name}</span>
                        <span>•</span>
                        <span>{data.patientSnapshot.age}y / {data.patientSnapshot.gender}</span>
                        <span>•</span>
                        <Badge variant="outline" className={cn("text-[10px] h-5", data.patientSnapshot.triage === 'Red' ? "text-red-600 border-red-200 bg-red-50" : "text-yellow-600 border-yellow-200 bg-yellow-50")}>
                            {data.patientSnapshot.triage} Triage
                        </Badge>
                    </div>
                )}

                <div className="space-y-2">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <ExclamationTriangleIcon className="w-3 h-3" /> Key Findings
                    </h5>
                    <ul className="space-y-1.5">
                        {data.keyFindings.map((finding, i) => (
                            <li key={i} className="text-sm text-foreground flex items-start gap-2">
                                <span className="mt-1.5 w-1 h-1 rounded-full bg-indigo-500 shrink-0" />
                                {finding}
                            </li>
                        ))}
                    </ul>
                </div>

                <Separator className="bg-border/50" />

                <div className="space-y-2">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <CheckCircleIcon className="w-3 h-3" /> Suggested Reviews
                    </h5>
                    <ul className="space-y-1.5">
                        {data.suggestedReviews.map((review, i) => (
                            <li key={i} className="text-sm text-foreground flex items-start gap-2">
                                <span className="mt-1.5 w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                                {review}
                            </li>
                        ))}
                    </ul>
                </div>

                {data.quickActions.length > 0 && (
                    <div className="pt-2 flex flex-wrap gap-2">
                        {data.quickActions.map((action, i) => (
                            <Button
                                key={i}
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs bg-white dark:bg-gray-800 border-indigo-100 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/50"
                                onClick={() => onAction(action.action)}
                            >
                                {action.label}
                            </Button>
                        ))}
                    </div>
                )}
            </CardContent>
            <CardFooter className="bg-muted/20 px-4 py-2 border-t border-border/50">
                <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 w-full justify-center">
                    <SparklesIcon className="w-3 h-3" />
                    AI-generated — please verify clinically.
                </p>
            </CardFooter>
        </Card>
    );
};
