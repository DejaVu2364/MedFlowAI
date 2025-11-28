import React from 'react';
import { VitalsRecord } from '../../types';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { cn } from '../../lib/utils';

interface VitalsTableProps {
    history: VitalsRecord[];
}

export const VitalsTable: React.FC<VitalsTableProps> = ({ history }) => {
    return (
        <div className="bg-background rounded-xl shadow-sm border border-border/50 overflow-hidden mt-6">
            <div className="px-4 py-3 border-b border-border/50 bg-muted/20">
                <h3 className="text-sm font-semibold text-foreground">Vitals Timeline</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border/50">
                    <thead className="bg-muted/30">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Timestamp</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">HR</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">BP</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">RR</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">SpO₂</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Temp</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Pain</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Source</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-background divide-y divide-border/50">
                        {history.map((record) => (
                            <tr key={record.vitalId} className="hover:bg-muted/20 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                    {new Date(record.recordedAt).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                                    {record.measurements.pulse || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                    {record.measurements.bp_sys}/{record.measurements.bp_dia}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                    {record.measurements.rr || '-'}
                                </td>
                                <td className={cn("px-6 py-4 whitespace-nowrap text-sm font-medium", (record.measurements.spo2 || 100) < 95 ? "text-red-500" : "text-foreground")}>
                                    {record.measurements.spo2 ? `${record.measurements.spo2}%` : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                    {record.measurements.temp_c ? `${record.measurements.temp_c}°C` : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                    {/* @ts-ignore */}
                                    {record.measurements.pain_score || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground capitalize">
                                    {record.source}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button className="text-primary hover:text-primary/80 mr-3 transition-colors">
                                        <PencilIcon className="w-4 h-4" />
                                    </button>
                                    <button className="text-destructive hover:text-destructive/80 transition-colors">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
