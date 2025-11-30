import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Patient } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { MicroSparkline } from './MicroSparkline';
import { TriageBadge } from '../common/TriageBadge';
import { SparklesIcon, UserIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { cn } from '../../lib/utils';

interface PatientOverviewCardProps {
    patient: Patient;
}

export const PatientOverviewCard: React.FC<PatientOverviewCardProps> = ({ patient }) => {
    const navigate = useNavigate();

    // Mock data derivation for sparklines (last 24h)
    // In real app, we'd filter patient.vitalsHistory
    const vitalsHistory = patient.vitalsHistory || [];
    const hrData = vitalsHistory.map(v => v.measurements.pulse || 0).filter(v => v > 0).slice(-24);
    const sysData = vitalsHistory.map(v => v.measurements.bp_sys || 0).filter(v => v > 0).slice(-24);
    const spo2Data = vitalsHistory.map(v => v.measurements.spo2 || 0).filter(v => v > 0).slice(-24);

    // Fill with mock if empty for visual demo
    const mockFill = (base: number, variance: number) => Array.from({ length: 12 }, () => base + Math.random() * variance - variance / 2);
    const finalHr = hrData.length > 0 ? hrData : mockFill(72, 10);
    const finalSys = sysData.length > 0 ? sysData : mockFill(120, 15);
    const finalSpo2 = spo2Data.length > 0 ? spo2Data : mockFill(98, 2);

    const riskLevel = patient.triage.level === 'Red' ? 'high' : patient.triage.level === 'Yellow' ? 'medium' : 'low';

    // Mock AI Summary if not present
    const aiSummary = patient.overview?.summary || "Patient stable overnight. No acute distress. Pending AM labs.";
    const changesCount = Math.floor(Math.random() * 5); // Mock changes count

    return (
        <Card
            className="group hover:shadow-lg hover:scale-[1.01] transition-all duration-200 cursor-pointer border-border/60"
            onClick={() => navigate(`/patient/${patient.id}`)}
        >
            <CardHeader className="pb-3 space-y-0">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                            {patient.name.charAt(0)}
                        </div>
                        <div>
                            <CardTitle className="text-base font-bold leading-none flex items-center gap-2">
                                {patient.name}
                                <TriageBadge level={patient.triage.level} />
                            </CardTitle>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1.5">
                                <span className="flex items-center gap-1"><UserIcon className="w-3 h-3" /> {patient.age}y / {patient.gender}</span>
                                <Separator orientation="vertical" className="h-3" />
                                <span className="flex items-center gap-1"><MapPinIcon className="w-3 h-3" /> Ward A • Bed {patient.id.slice(-2)}</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                                {patient.chiefComplaints?.slice(0, 3).map((c, i) => (
                                    <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-normal bg-muted/50 text-muted-foreground border-border/50">
                                        {c.complaint}
                                    </Badge>
                                ))}
                                {(patient.chiefComplaints?.length || 0) > 3 && (
                                    <span className="text-[10px] text-muted-foreground">+{patient.chiefComplaints!.length - 3} more</span>
                                )}
                            </div>
                        </div>
                    </div>
                    {changesCount > 0 && (
                        <Badge variant="secondary" className="text-[10px] font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
                            {changesCount} changes in 24h
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* AI Summary Snippet */}
                <div className="bg-indigo-50/50 dark:bg-indigo-950/10 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
                    <div className="flex items-center gap-1.5 mb-1 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        <SparklesIcon className="w-3 h-3" />
                        AI Summary
                    </div>
                    <p className="text-xs text-indigo-900/80 dark:text-indigo-200 line-clamp-2 leading-relaxed">
                        {aiSummary}
                    </p>
                </div>

                {/* Micro Sparklines */}
                <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                        <div className="flex justify-between items-end px-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">HR</span>
                            <span className="text-xs font-bold text-foreground">{Math.round(finalHr[finalHr.length - 1])}</span>
                        </div>
                        <MicroSparkline data={finalHr} color="#ef4444" height={32} />
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between items-end px-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">BP</span>
                            <span className="text-xs font-bold text-foreground">{Math.round(finalSys[finalSys.length - 1])}</span>
                        </div>
                        <MicroSparkline data={finalSys} color="#3b82f6" height={32} />
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between items-end px-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">SpO₂</span>
                            <span className="text-xs font-bold text-foreground">{Math.round(finalSpo2[finalSpo2.length - 1])}%</span>
                        </div>
                        <MicroSparkline data={finalSpo2} color="#10b981" height={32} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
