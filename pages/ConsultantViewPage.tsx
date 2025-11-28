import React, { useMemo } from 'react';
import { usePatient } from '../contexts/PatientContext';
import { PatientOverviewCard } from '../components/medview/PatientOverviewCard';
import { UsersIcon, FunnelIcon, ArrowsUpDownIcon } from '@heroicons/react/24/outline';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

const ConsultantViewPage: React.FC = () => {
    const { patients, isLoading } = usePatient();

    // Mock sorting/filtering could go here
    const sortedPatients = useMemo(() => {
        return [...patients].sort((a, b) => {
            // Sort by triage level (Red > Yellow > Green)
            const priority = { 'Red': 3, 'Yellow': 2, 'Green': 1, 'None': 0 };
            return (priority[b.triage.level] || 0) - (priority[a.triage.level] || 0);
        });
    }, [patients]);

    if (isLoading) {
        return (
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="h-64 bg-muted/20 animate-pulse rounded-xl border border-border/50" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <UsersIcon className="w-8 h-8 text-primary" />
                        Consultant Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Overview of all admitted patients • {patients.length} Active Cases
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Input placeholder="Filter patients..." className="max-w-xs bg-background" />
                    <Button variant="outline" size="icon">
                        <FunnelIcon className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                        <ArrowsUpDownIcon className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Grid */}
            {patients.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed rounded-xl">
                    <p className="text-muted-foreground">No active patients found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedPatients.map(patient => (
                        <PatientOverviewCard key={patient.id} patient={patient} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ConsultantViewPage;
