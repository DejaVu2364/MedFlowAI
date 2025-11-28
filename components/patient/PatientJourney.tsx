import React from 'react';
import { CheckCircle2, Circle, Clock, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { PatientStatus } from '../../types';

interface PatientJourneyProps {
    status: PatientStatus;
}

const STAGES = [
    { id: 'admission', label: 'Admission', statusMatches: ['Waiting for Triage'] },
    { id: 'triage', label: 'Triage', statusMatches: ['Waiting for Doctor'] },
    { id: 'investigation', label: 'Workup', statusMatches: ['In Treatment'] }, // Mapping "In Treatment" to Workup/Treatment for simplicity
    { id: 'treatment', label: 'Treatment', statusMatches: ['In Treatment'] },
    { id: 'discharge', label: 'Discharge', statusMatches: ['Discharged'] },
];

export const PatientJourney: React.FC<PatientJourneyProps> = ({ status }) => {
    // Simple logic to determine current step index based on status
    // This is a simplified mapping for the visual demo
    const getCurrentStepIndex = () => {
        if (status === 'Discharged') return 4;
        if (status === 'In Treatment') return 2; // Active treatment/workup
        if (status === 'Waiting for Doctor') return 1;
        return 0; // Waiting for Triage / Admission
    };

    const currentStep = getCurrentStepIndex();

    return (
        <div className="w-full py-4 px-6 bg-card border-b border-border/50 mb-6">
            <div className="flex items-center justify-between max-w-4xl mx-auto relative">
                {/* Progress Bar Background */}
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted -z-10 transform -translate-y-1/2" />

                {/* Active Progress Bar */}
                <div
                    className="absolute top-1/2 left-0 h-0.5 bg-primary -z-10 transform -translate-y-1/2 transition-all duration-500"
                    style={{ width: `${(currentStep / (STAGES.length - 1)) * 100}%` }}
                />

                {STAGES.map((stage, index) => {
                    const isCompleted = index < currentStep;
                    const isCurrent = index === currentStep;
                    const isUpcoming = index > currentStep;

                    return (
                        <div key={stage.id} className="flex flex-col items-center gap-2 bg-card px-2">
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                                isCompleted ? "bg-primary border-primary text-primary-foreground" :
                                    isCurrent ? "bg-background border-primary text-primary ring-4 ring-primary/10" :
                                        "bg-muted border-muted-foreground/30 text-muted-foreground"
                            )}>
                                {isCompleted ? <CheckCircle2 className="w-5 h-5" /> :
                                    isCurrent ? <Clock className="w-5 h-5 animate-pulse" /> :
                                        <Circle className="w-5 h-5" />}
                            </div>
                            <span className={cn(
                                "text-xs font-medium transition-colors duration-300",
                                isCurrent ? "text-primary font-bold" :
                                    isCompleted ? "text-foreground" :
                                        "text-muted-foreground"
                            )}>
                                {stage.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
