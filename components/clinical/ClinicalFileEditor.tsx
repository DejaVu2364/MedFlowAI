
import React, { useState } from 'react';
import { Patient, ClinicalFile } from '../../types';
import { usePatient } from '../../contexts/PatientContext';
import { ClinicalSection } from './ClinicalSection';
import { InconsistencyPanel } from './InconsistencyPanel';
import { useToast } from '../../contexts/ToastContext';

interface ClinicalFileEditorProps {
    patient: Patient;
}

const ClinicalFileEditor: React.FC<ClinicalFileEditorProps> = ({ patient }) => {
    const { updateClinicalFileSection } = usePatient();
    const { addToast } = useToast();
    const [editingSection, setEditingSection] = useState<string | null>(null);

    const clinicalFile = patient.clinicalFile;

    const handleSave = (sectionKey: string, content: string, newInconsistencies?: string[]) => {
        // Construct updates
        const updates: Partial<ClinicalFile> = {};

        if (sectionKey.startsWith('systemic.')) {
            const sysKey = sectionKey.split('.')[1];
            updates.systemic = {
                ...clinicalFile.systemic,
                [sysKey]: content
            } as any;
        } else {
            // @ts-ignore - dynamic key access
            updates[sectionKey] = content;
        }

        // Handle inconsistencies
        if (newInconsistencies && newInconsistencies.length > 0) {
            updates.inconsistencies = [
                ...(clinicalFile.inconsistencies || []),
                ...newInconsistencies
            ];
        }

        updates.version = (clinicalFile.version || 0) + 1;

        updateClinicalFileSection(patient.id, updates);
        setEditingSection(null);
        addToast('Section updated successfully', 'success');
    };

    const sections = [
        { key: 'hopi', title: 'History of Present Illness' },
        { key: 'pmh', title: 'Past Medical History' },
        { key: 'dh', title: 'Drug History' },
        { key: 'sh', title: 'Social History' },
        { key: 'allergies', title: 'Allergies' },
        { key: 'gpe', title: 'General Physical Exam' },
        { key: 'systemic.cvs', title: 'CVS' },
        { key: 'systemic.rs', title: 'Respiratory System' },
        { key: 'systemic.cns', title: 'CNS' },
        { key: 'systemic.abdomen', title: 'Abdomen' },
    ];

    const getContent = (key: string) => {
        if (key.startsWith('systemic.')) {
            const sysKey = key.split('.')[1] as keyof typeof clinicalFile.systemic;
            return clinicalFile.systemic?.[sysKey] || '';
        }
        // @ts-ignore
        return clinicalFile[key] || '';
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <InconsistencyPanel
                inconsistencies={clinicalFile.inconsistencies || []}
                onItemClick={(item) => {
                    // TODO: Scroll to relevant section if possible
                    console.log("Clicked inconsistency:", item);
                }}
            />

            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Clinical File</h2>
                    <p className="text-sm text-muted-foreground">Version {clinicalFile.version || 1}</p>
                </div>

                <div className="p-6 space-y-2">
                    {sections.map(section => (
                        <ClinicalSection
                            key={section.key}
                            title={section.title}
                            content={getContent(section.key)}
                            sectionKey={section.key}
                            isEditing={editingSection === section.key}
                            onEditStart={() => setEditingSection(section.key)}
                            onSave={(content, inconsistencies) => handleSave(section.key, content, inconsistencies)}
                            onCancel={() => setEditingSection(null)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ClinicalFileEditor;
