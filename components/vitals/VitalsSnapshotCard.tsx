import React from 'react';
import { Card, CardContent } from '../ui/card';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from '@heroicons/react/24/solid';
import { VitalsRecord } from '../../types';
import { cn } from '../../lib/utils';

interface VitalsSnapshotCardProps {
    latest: VitalsRecord | undefined;
}

export const VitalsSnapshotCard: React.FC<VitalsSnapshotCardProps> = ({ latest }) => {
    if (!latest) return null;

    const items = [
        { label: 'HR', value: latest.measurements.pulse, unit: 'bpm', status: 'normal', trend: 'stable' },
        { label: 'BP', value: `${latest.measurements.bp_sys}/${latest.measurements.bp_dia}`, unit: 'mmHg', status: 'warning', trend: 'up' },
        { label: 'RR', value: latest.measurements.rr, unit: '/min', status: 'normal', trend: 'stable' },
        { label: 'SpO₂', value: latest.measurements.spo2, unit: '%', status: 'critical', trend: 'down' },
        { label: 'Temp', value: latest.measurements.temp_c, unit: '°C', status: 'normal', trend: 'stable' },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'critical': return 'text-red-500 bg-red-50 dark:bg-red-900/20';
            case 'warning': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
            default: return 'text-green-600 bg-green-50 dark:bg-green-900/20';
        }
    };

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'up': return <ArrowUpIcon className="w-3 h-3" />;
            case 'down': return <ArrowDownIcon className="w-3 h-3" />;
            default: return <MinusIcon className="w-3 h-3" />;
        }
    };

    return (
        <Card className="border-border/50 shadow-sm mt-4">
            <CardContent className="p-4 space-y-3">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Latest Snapshot</h3>
                <div className="grid grid-cols-2 gap-3">
                    {items.map((item, i) => (
                        <div key={i} className={cn("p-2 rounded-lg flex flex-col items-center justify-center border border-transparent", getStatusColor(item.status))}>
                            <div className="flex items-center gap-1 mb-1">
                                <span className="text-[10px] font-bold uppercase opacity-70">{item.label}</span>
                                {getTrendIcon(item.trend)}
                            </div>
                            <div className="text-xl font-bold leading-none">{item.value}</div>
                            <div className="text-[10px] opacity-70">{item.unit}</div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};
