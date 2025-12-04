import React, { useState } from 'react';
import { ClinicalFile, Patient } from '../../types';
import { ClinicalSection } from './ClinicalSection';
import { InconsistencyPanel } from './InconsistencyPanel';
import { isTestMode } from '../../lib/utils'; // Import flag

interface ClinicalFileEditorProps {
    patient: Patient;
}

export const ClinicalFileEditor: React.FC<ClinicalFileEditorProps> = ({ patient }) => {
    // --- TEST MODE OVERRIDE ---
    if (isTestMode) {
        return (
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                <h3 className="text-sm font-bold text-zinc-500 mb-2">Clinical File (Test Mode)</h3>
                <div className="space-y-2">
                    <div className="h-4 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
                    <div className="h-4 w-1/2 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
                    <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
                </div>
            </div>
        );
    }

    const file = patient.clinicalFile;

    const getSectionInconsistencies = (key: string) => {
        return file.inconsistencies?.filter(i => i.toLowerCase().includes(key.toLowerCase())) || [];
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-950 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Clinical File</h2>
                    <p className="text-xs text-zinc-500 mt-1">
                        Version {file.version} • Last updated just now
                    </p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <InconsistencyPanel inconsistencies={file.inconsistencies} />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6">
                    <div className="space-y-1">
                        <ClinicalSection
                            title="History of Present Illness"
                            sectionKey="hopi"
                            value={file.hopi}
                            patientId={patient.id}
                            inconsistencies={getSectionInconsistencies('history')}
                        />
                        <ClinicalSection
                            title="Past Medical History"
                            sectionKey="pmh"
                            value={file.pmh}
                            patientId={patient.id}
                        />
                         <ClinicalSection
                            title="Drug History"
                            sectionKey="dh"
                            value={file.dh}
                            patientId={patient.id}
                        />
                        <ClinicalSection
                            title="Social History"
                            sectionKey="sh"
                            value={file.sh}
                            patientId={patient.id}
                        />
                        <ClinicalSection
                            title="Allergies"
                            sectionKey="allergies"
                            value={file.allergies}
                            patientId={patient.id}
                        />
                    </div>

                    <div className="space-y-1">
                        <ClinicalSection
                            title="General Physical Examination"
                            sectionKey="gpe"
                            value={file.gpe}
                            patientId={patient.id}
                        />

                        <div className="pt-2 pb-1">
                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 px-1">Systemic Examination</h4>
                        </div>

                        <ClinicalSection
                            title="CVS"
                            sectionKey="systemic.cvs"
                            value={file.systemic?.cvs}
                            patientId={patient.id}
                        />
                        <ClinicalSection
                            title="Respiratory System"
                            sectionKey="systemic.rs"
                            value={file.systemic?.rs}
                            patientId={patient.id}
                        />
                         <ClinicalSection
                            title="CNS"
                            sectionKey="systemic.cns"
                            value={file.systemic?.cns}
                            patientId={patient.id}
                        />
                         <ClinicalSection
                            title="Abdomen"
                            sectionKey="systemic.abdomen"
                            value={file.systemic?.abdomen}
                            patientId={patient.id}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
