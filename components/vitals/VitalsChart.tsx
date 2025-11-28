import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceArea } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface VitalsChartProps {
    title: string;
    data: any[];
    dataKey: string;
    unit: string;
    color: string;
    minDomain?: number;
    maxDomain?: number;
    normalRange?: [number, number];
}

export const VitalsChart: React.FC<VitalsChartProps> = ({ title, data, dataKey, unit, color, minDomain, maxDomain, normalRange }) => {
    const [isCollapsed, setIsCollapsed] = React.useState(false);

    return (
        <Card className="border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between bg-muted/20">
                <CardTitle className="text-sm font-semibold text-foreground">{title}</CardTitle>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setIsCollapsed(!isCollapsed)}>
                    {isCollapsed ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronUpIcon className="w-4 h-4" />}
                </Button>
            </CardHeader>
            {!isCollapsed && (
                <CardContent className="p-4 h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                            <XAxis
                                dataKey="timestamp"
                                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                                tickLine={false}
                                axisLine={false}
                                minTickGap={30}
                            />
                            <YAxis
                                domain={[minDomain || 'auto', maxDomain || 'auto']}
                                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                                tickLine={false}
                                axisLine={false}
                                width={30}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px' }}
                                itemStyle={{ color: 'var(--foreground)' }}
                                labelStyle={{ color: 'var(--muted-foreground)', marginBottom: '4px' }}
                            />
                            {normalRange && (
                                <ReferenceArea y1={normalRange[0]} y2={normalRange[1]} fill="var(--primary)" fillOpacity={0.05} />
                            )}
                            <Line
                                type="monotone"
                                dataKey={dataKey}
                                stroke={color}
                                strokeWidth={2}
                                dot={{ r: 3, fill: color, strokeWidth: 0 }}
                                activeDot={{ r: 5, strokeWidth: 0 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            )}
        </Card>
    );
};
