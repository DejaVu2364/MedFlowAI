import React from 'react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { cn } from '../../lib/utils';

interface MicroSparklineProps {
    data: number[];
    color?: string;
    className?: string;
    height?: number;
}

export const MicroSparkline: React.FC<MicroSparklineProps> = ({ data, color = "#3b82f6", className, height = 40 }) => {
    const chartData = data.map((val, i) => ({ i, value: val }));
    const gradientId = `micro-gradient-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <div className={cn("w-full", className)} style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
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
                        strokeWidth={2}
                        fill={`url(#${gradientId})`}
                        isAnimationActive={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};
