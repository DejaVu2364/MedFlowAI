import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, MinusIcon } from '@heroicons/react/24/outline';
import { cn } from '../../lib/utils';

interface ChangeItem {
    category: 'vitals' | 'labs' | 'symptoms' | 'meds';
    description: string;
    trend?: 'up' | 'down' | 'stable';
    severity?: 'high' | 'medium' | 'low';
}

interface AIChangeCardProps {
    changes: ChangeItem[];
    className?: string;
}

export const AIChangeCard: React.FC<AIChangeCardProps> = ({ changes, className }) => {
    const getIcon = (trend?: 'up' | 'down' | 'stable') => {
        switch (trend) {
            case 'up': return <ArrowTrendingUpIcon className="w-4 h-4 text-red-500" />;
            case 'down': return <ArrowTrendingDownIcon className="w-4 h-4 text-blue-500" />;
            default: return <MinusIcon className="w-4 h-4 text-gray-400" />;
        }
    };

    const getSeverityColor = (severity?: 'high' | 'medium' | 'low') => {
        switch (severity) {
            case 'high': return "bg-red-50 text-red-700 border-red-200";
            case 'medium': return "bg-yellow-50 text-yellow-700 border-yellow-200";
            case 'low': return "bg-blue-50 text-blue-700 border-blue-200";
            default: return "bg-gray-50 text-gray-700 border-gray-200";
        }
    };

    return (
        <Card className={cn("border-l-4 border-l-indigo-500 shadow-sm", className)}>
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">What Changed Since Yesterday</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
                {changes.map((change, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                        <div className="mt-0.5">{getIcon(change.trend)}</div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium uppercase text-muted-foreground">{change.category}</span>
                                {change.severity && (
                                    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4", getSeverityColor(change.severity))}>
                                        {change.severity}
                                    </Badge>
                                )}
                            </div>
                            <p className="text-sm font-medium leading-tight">{change.description}</p>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};
