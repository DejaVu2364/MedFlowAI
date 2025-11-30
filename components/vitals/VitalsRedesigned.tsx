import React, { useState, useMemo } from 'react';
import { Patient } from '../../types';
import { VitalsInputCard } from './VitalsInputCard';
import { VitalsSnapshotCard } from './VitalsSnapshotCard';
import { VitalsChart } from './VitalsChart';
import { AICard } from './AICard';
import { AlertsCard } from './AlertsCard';
import { VitalsTable } from './VitalsTable';
import PulseOxLiveBox from './PulseOxLiveBox';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { usePatient } from '../../contexts/PatientContext';

interface VitalsRedesignedProps {
    patient: Patient;
}

export const VitalsRedesigned: React.FC<VitalsRedesignedProps> = ({ patient }) => {
    const { isLoading } = usePatient();
    const [timeRange, setTimeRange] = useState<'6h' | '24h' | '3d' | '7d'>('24h');

    // Mock data generation if history is empty or sparse
    const data = useMemo(() => {
        const history = patient.vitalsHistory || [];
        if (history.length < 5) {
            return Array.from({ length: 24 }, (_, i) => ({
                timestamp: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
                measurements: {
                    pulse: 70 + Math.random() * 20 + (i > 18 ? 15 : 0),
                    bp_sys: 110 + Math.random() * 20,
                    bp_dia: 70 + Math.random() * 10,
                    spo2: 96 + Math.random() * 3 - (i > 20 ? 4 : 0),
                    rr: 16 + Math.random() * 4,
                    temp_c: 36.5 + Math.random() * 1,
                    pain_score: Math.floor(Math.random() * 3)
                }
            }));
        }
        return history.map(h => ({
            timestamp: h.recordedAt,
            measurements: h.measurements
        })).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [patient.vitalsHistory]);

    const filteredData = useMemo(() => {
        const hours = timeRange === '6h' ? 6 : timeRange === '24h' ? 24 : timeRange === '3d' ? 72 : 168;
        const cutoff = Date.now() - hours * 3600000;
        // Mock filter logic - in real app, filter by timestamp
        return data.map(d => ({
            timestamp: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            hr: d.measurements.pulse,
            bp_sys: d.measurements.bp_sys,
            bp_dia: d.measurements.bp_dia,
            rr: d.measurements.rr,
            spo2: d.measurements.spo2,
            temp: d.measurements.temp_c,
            // @ts-ignore
            pain: d.measurements.pain_score || 0
        }));
    }, [data, timeRange]);

    const latestVitals = patient.vitalsHistory && patient.vitalsHistory.length > 0
        ? patient.vitalsHistory[0]
        : undefined;

    const insights = [
        "SpO₂ dropped by 6% in the last 2 hours.",
        "RR trending upward; monitor closely.",
        "HR stabilizing after morning meds."
    ];

    const alerts = latestVitals && (latestVitals.measurements.spo2 || 100) < 92
        ? ["Critical SpO₂ levels detected."]
        : [];

    if (isLoading) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-3 space-y-6">
                        <div className="h-64 bg-muted/20 animate-pulse rounded-xl" />
                        <div className="h-40 bg-muted/20 animate-pulse rounded-xl" />
                    </div>
                    <div className="lg:col-span-6 space-y-4">
                        <div className="h-8 w-48 bg-muted/20 animate-pulse rounded" />
                        <div className="space-y-4">
                            <div className="h-48 bg-muted/20 animate-pulse rounded-xl" />
                            <div className="h-48 bg-muted/20 animate-pulse rounded-xl" />
                            <div className="h-48 bg-muted/20 animate-pulse rounded-xl" />
                        </div>
                    </div>
                    <div className="lg:col-span-3 space-y-6">
                        <div className="h-32 bg-muted/20 animate-pulse rounded-xl" />
                        <div className="h-48 bg-muted/20 animate-pulse rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* 3-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* LEFT PANEL: Quick Entry + Snapshot (Col Span 3) */}
                <div className="lg:col-span-3 space-y-6">
                    <VitalsInputCard patientId={patient.id} onSave={() => { }} />
                    <VitalsSnapshotCard latest={latestVitals} />
                </div>

                {/* MAIN PANEL: Trend Graphs (Col Span 6) */}
                <div className="lg:col-span-6 space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold tracking-tight">Trends</h2>
                        <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
                            <TabsList className="h-8">
                                <TabsTrigger value="6h" className="text-xs h-7">6h</TabsTrigger>
                                <TabsTrigger value="24h" className="text-xs h-7">24h</TabsTrigger>
                                <TabsTrigger value="3d" className="text-xs h-7">3d</TabsTrigger>
                                <TabsTrigger value="7d" className="text-xs h-7">7d</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                    <div className="space-y-4">
                        <VitalsChart
                            title="SpO₂"
                            data={filteredData}
                            dataKey="spo2"
                            unit="%"
                            color="#0ea5e9"
                            minDomain={80}
                            maxDomain={100}
                            normalRange={[95, 100]}
                        />
                        <VitalsChart
                            title="Respiratory Rate"
                            data={filteredData}
                            dataKey="rr"
                            unit="/min"
                            color="#10b981"
                            normalRange={[12, 20]}
                        />
                        <VitalsChart
                            title="Temperature"
                            data={filteredData}
                            dataKey="temp"
                            unit="°C"
                            color="#f97316"
                            minDomain={35}
                            maxDomain={40}
                            normalRange={[36.5, 37.5]}
                        />
                    </div>
                </div>

                {/* RIGHT PANEL: AI Insights + Alerts + Device (Col Span 3) */}
                <div className="lg:col-span-3 space-y-6">
                    <PulseOxLiveBox />
                    <AICard insights={insights} />
                    <AlertsCard alerts={alerts} />
                </div>
            </div>

            {/* BOTTOM SECTION: Timeline Table */}
            <VitalsTable history={patient.vitalsHistory || []} />
        </div>
    );
};
