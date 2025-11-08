

import React, { useContext } from 'react';
import { Patient, TriageLevel } from '../types';
import { AppContext } from '../App';
import { AppContextType } from '../types';

interface PatientCardProps {
    patient: Patient;
    onTriageClick?: (patientId: string) => void;
    onClick?: (patientId: string) => void;
}

const TriageBadge: React.FC<{ level: TriageLevel }> = ({ level }) => {
    const baseClasses = "px-2.5 py-1 text-xs font-semibold rounded-full inline-block";
    const levelStyles: Record<TriageLevel, string> = {
        Red: 'bg-red-100 text-triage-red',
        Yellow: 'bg-yellow-100 text-triage-yellow',
        Green: 'bg-green-100 text-triage-green',
        None: 'bg-gray-100 text-triage-none dark:bg-neutral-700 dark:text-neutral-300',
    };
    return <span className={`${baseClasses} ${levelStyles[level]}`}>{level}</span>;
};

const CacheIndicator: React.FC = () => (
    <div title="This suggestion was served from a local cache for faster performance." className="inline-block ml-1 text-yellow-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5.293l6.293-6.293a1 1 0 111.414 1.414L13.414 8.707H18a1 1 0 01.954 1.287l-5 10A1 1 0 0113 20H8a1 1 0 01-.954-1.287l5-10A1 1 0 0113 8V2.707L6.707 8.999a1 1 0 11-1.414-1.414L11.586 2H6a1 1 0 01-.954-1.287l1-2A1 1 0 017 0h4.3z" clipRule="evenodd" />
        </svg>
    </div>
);


const PatientCard: React.FC<PatientCardProps> = ({ patient, onTriageClick, onClick }) => {
    const { currentUser, logAuditEvent } = useContext(AppContext) as AppContextType;

    const timeSince = (dateString: string) => {
        const date = new Date(dateString);
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return `${Math.floor(interval)}y ago`;
        interval = seconds / 2592000;
        if (interval > 1) return `${Math.floor(interval)}mo ago`;
        interval = seconds / 86400;
        if (interval > 1) return `${Math.floor(interval)}d ago`;
        interval = seconds / 3600;
        if (interval > 1) return `${Math.floor(interval)}h ago`;
        interval = seconds / 60;
        if (interval > 1) return `${Math.floor(interval)}m ago`;
        return `${Math.floor(seconds)}s ago`;
    };

    const handleCardClick = () => {
        if (onClick) {
            // Phase 3+: Log audit event on card click before navigating
            logAuditEvent({
                userId: currentUser.id,
                patientId: patient.id,
                action: 'view',
                entity: 'patient_record'
            });
            onClick(patient.id);
        }
    };

    const handleTriageButtonClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click event from firing
        if (onTriageClick) {
            onTriageClick(patient.id);
        }
    };

    return (
        <div 
            className="bg-background-primary rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden cursor-pointer"
            onClick={handleCardClick}
            role="button"
            aria-label={`View details for ${patient.name}`}
        >
            <div className={`p-4 border-l-8 border-triage-${patient.triage.level.toLowerCase()}`}>
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-lg font-bold text-text-primary">{patient.name}</p>
                        <p className="text-sm text-text-tertiary">{patient.age}, {patient.gender}</p>
                    </div>
                    <TriageBadge level={patient.triage.level} />
                </div>
                
                <div className="mt-4">
                    <p className="text-sm font-medium text-text-secondary">Complaint:</p>
                    <p className="text-sm text-text-primary leading-snug truncate">{patient.complaint}</p>
                </div>

                {patient.aiTriage && (
                    <div className="mt-3 pt-3 border-t border-border-color">
                        <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider flex items-center">
                           AI ADVISORY
                           {patient.aiTriage.fromCache && <CacheIndicator />}
                        </p>
                        <div className="flex justify-between items-center mt-1 text-sm">
                            <span className="text-text-secondary">{patient.aiTriage.department}</span>
                             <TriageBadge level={patient.aiTriage.suggested_triage} />
                        </div>
                    </div>
                )}
            </div>
            <div className="bg-background-secondary px-4 py-2 flex justify-between items-center text-xs text-text-tertiary">
                <div>
                    <span>{patient.status}</span>
                    <span className="text-text-tertiary/50 mx-2">|</span>
                    <span>{timeSince(patient.registrationTime)}</span>
                </div>
                {patient.status === 'Waiting for Triage' && onTriageClick && (
                    <button
                        onClick={handleTriageButtonClick}
                        className="px-3 py-1 text-xs font-semibold text-white bg-brand-blue rounded-full hover:bg-brand-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue transition-colors"
                    >
                        Triage
                    </button>
                )}
            </div>
        </div>
    );
};

export default PatientCard;