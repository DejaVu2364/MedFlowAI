import React from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis, Area, AreaChart, ReferenceDot } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn } from '../../lib/utils';

interface SparklineGraphProps {
    title: string;
    data: { value: number; timestamp: string }[];
    color?: string;
    unit?: string;
    className?: string;
    trend?: 'up' | 'down' | 'stable';
}

export const SparklineGraph: React.FC<SparklineGraphProps> = ({ title, data, color = "#2B79C2", unit, className, trend }) => {
    const latestValue = data[data.length - 1]?.value;
    const gradientId = `gradient-${title.replace(/\s+/g, '-').toLowerCase()}`;

    return (
        <Card className={cn("overflow-hidden", className)}>
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</CardTitle>
                {trend && (
                    <span className={cn(
                        "text-xs font-bold px-1.5 py-0.5 rounded",
                        trend === 'up' ? "bg-red-100 text-red-700" :
                            trend === 'down' ? "bg-blue-100 text-blue-700" :
                                "bg-gray-100 text-gray-700"
                    )}>
                        {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
                    </span>
                )}
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-2xl font-bold text-foreground">{latestValue}</span>
                    <span className="text-xs text-muted-foreground">{unit}</span>
                </div>
                <div className="h-[60px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={color}
                                fillOpacity={1}
                                fill={`url(#${gradientId})`}
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};
