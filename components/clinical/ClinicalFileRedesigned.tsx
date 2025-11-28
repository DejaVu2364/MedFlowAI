import React, { useState, useEffect } from 'react';
import { usePatient } from '../../contexts/PatientContext';
import { useAuth } from '../../contexts/AuthContext';
import { Patient, User, HistorySectionData, SystemicExamSectionData, Allergy } from '../../types';
import { CheckCircleIcon, ExclamationCircleIcon, MicrophoneIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { AIInsightBubble } from '../medview/AIInsightBubble';
import VoiceInput from '../VoiceInput';
import { cn } from '../../lib/utils';

// --- TYPES ---

interface SectionProps {
    patient: Patient;
    isSignedOff: boolean;
    onSave?: () => void;
}

// --- SECTIONS ---

const ComplaintSection: React.FC<SectionProps> = ({ patient, isSignedOff, onSave }) => {
    const { updateClinicalFileSection, checkMissingInfo } = usePatient();
    const complaint = patient.clinicalFile.sections.history?.complaints?.[0]?.symptom || '';
    const [isScanning, setIsScanning] = useState(false);

    const handleChange = (val: string) => {
        updateClinicalFileSection(patient.id, 'history', { complaints: [{ symptom: val, duration: 'Unknown' }] });
    };

    const handleScan = async () => {
        setIsScanning(true);
        await checkMissingInfo(patient.id, 'history');
        setIsScanning(false);
    };

    return (
        <div className="space-y-4">
            <div className="relative">
                <Input
                    value={complaint}
                    onChange={e => handleChange(e.target.value)}
                    disabled={isSignedOff}
                    placeholder="e.g., Sudden onset chest pain"
                    className="text-lg font-medium h-12"
                    data-testid="complaint-input"
                    aria-label="Presenting Complaint input"
                />
                {!isSignedOff && (
                    <div className="absolute right-2 top-2.5 flex gap-2">
                        <AIInsightBubble type="missing-info" onClick={handleScan} label={isScanning ? "Scanning..." : "Scan Missing"} />
                    </div>
                )}
            </div>
            {!isSignedOff && (
                <div className="flex justify-end">
                    <Button size="sm" onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (onSave) onSave();
                    }}>Save & Collapse</Button>
                </div>
            )}
        </div>
    );
};

const HPISection: React.FC<SectionProps> = ({ patient, isSignedOff, onSave }) => {
    const { updateClinicalFileSection, formatHpi } = usePatient();
    const hpi = patient.clinicalFile.sections.history?.hpi || '';
    const [isFormatting, setIsFormatting] = useState(false);

    const handleChange = (val: string) => updateClinicalFileSection(patient.id, 'history', { hpi: val });

    const insertTemplate = (text: string) => {
        const newVal = hpi ? `${hpi}\n${text}: ` : `${text}: `;
        handleChange(newVal);
    };

    const handleFormat = async () => {
        setIsFormatting(true);
        await formatHpi(patient.id);
        setIsFormatting(false);
    };

    return (
        <div className="space-y-4">
            <div className="relative">
                <Textarea
                    value={hpi}
                    onChange={e => handleChange(e.target.value)}
                    disabled={isSignedOff}
                    placeholder="Describe the history of present illness..."
                    className="min-h-[150px] resize-none"
                    data-testid="hpi-input"
                    aria-label="History of Present Illness input"
                />
                {!isSignedOff && (
                    <div className="absolute bottom-3 right-3">
                        <VoiceInput onTranscript={text => handleChange(hpi + ' ' + text)} />
                    </div>
                )}
            </div>
            {!isSignedOff && (
                <div className="flex justify-between items-center">
                    <div className="flex flex-wrap gap-2">
                        {['Onset', 'Duration', 'Character', 'Radiation', 'Aggravating', 'Relieving'].map(opt => (
                            <Badge key={opt} variant="outline" className="cursor-pointer hover:bg-muted" onClick={() => insertTemplate(opt)}>
                                + {opt}
                            </Badge>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <AIInsightBubble type="auto-format" onClick={handleFormat} label={isFormatting ? "Formatting..." : "Auto-Format"} />
                        <Button size="sm" onClick={onSave}>Save</Button>
                    </div>
                </div>
            )}
        </div>
    );
};

const AssociatedSymptomsSection: React.FC<SectionProps> = ({ patient, isSignedOff, onSave }) => {
    const { updateClinicalFileSection } = usePatient();
    const symptoms = patient.clinicalFile.sections.history?.associated_symptoms || [];
    const [input, setInput] = useState('');

    const addSymptom = (s: string) => {
        if (s && !symptoms.includes(s)) {
            updateClinicalFileSection(patient.id, 'history', { associated_symptoms: [...symptoms, s] });
        }
        setInput('');
    };

    const removeSymptom = (s: string) => {
        updateClinicalFileSection(patient.id, 'history', { associated_symptoms: symptoms.filter(sym => sym !== s) });
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
                {symptoms.map(s => (
                    <Badge key={s} variant="secondary" className="pl-2 pr-1 py-1 gap-1">
                        {s}
                        {!isSignedOff && <XMarkIcon className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => removeSymptom(s)} />}
                    </Badge>
                ))}
            </div>
            {!isSignedOff && (
                <div className="flex gap-2">
                    <Input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addSymptom(input)}
                        placeholder="Type symptom and press Enter..."
                        className="flex-1"
                    />
                    <Button size="sm" variant="outline" onClick={() => addSymptom(input)}><PlusIcon className="w-4 h-4" /></Button>
                </div>
            )}
            {!isSignedOff && (
                <div className="flex flex-wrap gap-2">
                    {['Fever', 'Nausea', 'Vomiting', 'Headache', 'Dizziness', 'Shortness of Breath'].map(opt => (
                        <Badge key={opt} variant="outline" className="cursor-pointer hover:bg-muted" onClick={() => addSymptom(opt)}>
                            + {opt}
                        </Badge>
                    ))}
                </div>
            )}
            {!isSignedOff && (
                <div className="flex justify-end">
                    <Button size="sm" onClick={onSave}>Save</Button>
                </div>
            )}
        </div>
    );
};

const HistoryGridSection: React.FC<SectionProps> = ({ patient, isSignedOff, onSave }) => {
    const { updateClinicalFileSection } = usePatient();
    const history = patient.clinicalFile.sections.history || {};

    const Field = ({ label, fieldKey }: { label: string, fieldKey: keyof HistorySectionData }) => (
        <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase">{label}</label>
            <Textarea
                value={(history[fieldKey] as string) || ''}
                onChange={e => updateClinicalFileSection(patient.id, 'history', { [fieldKey]: e.target.value })}
                disabled={isSignedOff}
                className="min-h-[80px] resize-none"
                placeholder="None"
            />
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Past Medical History" fieldKey="past_medical_history" />
                <Field label="Drug History" fieldKey="drug_history" />
                <Field label="Family History" fieldKey="family_history" />
                <Field label="Social History" fieldKey="personal_social_history" />
            </div>
            {!isSignedOff && (
                <div className="flex justify-end">
                    <Button size="sm" onClick={onSave}>Save</Button>
                </div>
            )}
        </div>
    );
};

const AllergiesSection: React.FC<SectionProps> = ({ patient, isSignedOff, onSave }) => {
    const { updateClinicalFileSection } = usePatient();
    const allergies = patient.clinicalFile.sections.history?.allergy_history || [];

    const addAllergy = () => {
        updateClinicalFileSection(patient.id, 'history', { allergy_history: [...allergies, { substance: '', reaction: '', severity: 'Mild' }] });
    };

    const updateAllergy = (index: number, field: keyof Allergy, val: string) => {
        const newAllergies = [...allergies];
        newAllergies[index] = { ...newAllergies[index], [field]: val };
        updateClinicalFileSection(patient.id, 'history', { allergy_history: newAllergies });
    };

    return (
        <div className="space-y-4">
            {allergies.length === 0 && <p className="text-sm text-muted-foreground italic">No known allergies recorded.</p>}
            {allergies.map((a, i) => (
                <div key={i} className="flex gap-2 items-center bg-destructive/10 p-2 rounded-lg border border-destructive/20">
                    <Input
                        value={a.substance}
                        onChange={e => updateAllergy(i, 'substance', e.target.value)}
                        placeholder="Substance"
                        className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0"
                    />
                    <select
                        value={a.severity}
                        onChange={e => updateAllergy(i, 'severity', e.target.value)}
                        className="bg-transparent text-xs font-medium outline-none"
                    >
                        <option>Mild</option><option>Moderate</option><option>Severe</option>
                    </select>
                    {!isSignedOff && <Button variant="ghost" size="sm" onClick={() => updateClinicalFileSection(patient.id, 'history', { allergy_history: allergies.filter((_, idx) => idx !== i) })} className="h-6 w-6 p-0 hover:bg-destructive/20"><XMarkIcon className="w-4 h-4" /></Button>}
                </div>
            ))}
            {!isSignedOff && (
                <div className="flex justify-between items-center">
                    <Button variant="ghost" size="sm" onClick={addAllergy} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                        <PlusIcon className="w-4 h-4 mr-1" /> Add Allergy
                    </Button>
                    <Button size="sm" onClick={onSave}>Save</Button>
                </div>
            )}
        </div>
    );
};

const GPESection: React.FC<SectionProps> = ({ patient, isSignedOff, onSave }) => {
    const { updateClinicalFileSection, summarizeSection } = usePatient();
    const gpe = patient.clinicalFile.sections.gpe || {};
    const [isSummarizing, setIsSummarizing] = useState(false);

    const handleSummary = async () => {
        setIsSummarizing(true);
        await summarizeSection(patient.id, 'gpe');
        setIsSummarizing(false);
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Appearance</label>
                    <select value={gpe.general_appearance || ''} onChange={e => updateClinicalFileSection(patient.id, 'gpe', { general_appearance: e.target.value })} disabled={isSignedOff} className="w-full mt-1 p-2 bg-background border rounded-md text-sm outline-none focus:ring-2 focus:ring-ring">
                        <option value="">Select...</option><option value="well">Well</option><option value="ill">Ill-looking</option><option value="toxic">Toxic</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Build</label>
                    <select value={gpe.build || ''} onChange={e => updateClinicalFileSection(patient.id, 'gpe', { build: e.target.value })} disabled={isSignedOff} className="w-full mt-1 p-2 bg-background border rounded-md text-sm outline-none focus:ring-2 focus:ring-ring">
                        <option value="">Select...</option><option value="average">Average</option><option value="thin">Thin</option><option value="obese">Obese</option>
                    </select>
                </div>
            </div>
            <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">Quick Check</label>
                <div className="flex flex-wrap gap-3">
                    {['Pallor', 'Icterus', 'Cyanosis', 'Clubbing', 'LAD', 'Edema'].map(key => {
                        const k = key.toLowerCase() as keyof typeof gpe.flags;
                        return (
                            <label key={key} className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-all text-xs font-medium",
                                gpe.flags?.[k] ? "bg-destructive/10 border-destructive/30 text-destructive" : "bg-background hover:bg-muted"
                            )}>
                                <input type="checkbox" checked={!!gpe.flags?.[k]} onChange={() => updateClinicalFileSection(patient.id, 'gpe', { flags: { ...gpe.flags, [k]: !gpe.flags?.[k] } })} disabled={isSignedOff} className="hidden" />
                                {key}
                            </label>
                        );
                    })}
                </div>
            </div>
            {gpe.aiGeneratedSummary && (
                <div className="p-3 bg-blue-50/50 text-blue-800 text-xs rounded-lg border border-blue-100 italic">
                    AI Summary: {gpe.aiGeneratedSummary}
                </div>
            )}
            {!isSignedOff && (
                <div className="flex justify-end gap-2">
                    <AIInsightBubble type="generate" onClick={handleSummary} label={isSummarizing ? "Summarizing..." : "Generate Summary"} />
                    <Button size="sm" onClick={onSave}>Save</Button>
                </div>
            )}
        </div>
    );
};

const SystemicSection: React.FC<SectionProps> = ({ patient, isSignedOff, onSave }) => {
    const { updateClinicalFileSection } = usePatient();
    const systemic = patient.clinicalFile.sections.systemic || {};
    const systems: { key: keyof SystemicExamSectionData; label: string }[] = [
        { key: 'cvs', label: 'CVS' }, { key: 'rs', label: 'Respiratory' }, { key: 'abdomen', label: 'Abdomen' },
        { key: 'cns', label: 'CNS' }, { key: 'msk', label: 'Musculoskeletal' }
    ];

    return (
        <div className="space-y-4">
            {systems.map(({ key, label }) => (
                <div key={key} className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">{label}</label>
                    <Textarea
                        minRows={2}
                        value={systemic[key]?.summary || ''}
                        onChange={e => updateClinicalFileSection(patient.id, 'systemic', { [key]: { ...systemic[key], summary: e.target.value } })}
                        disabled={isSignedOff}
                        placeholder={`Notes for ${label}...`}
                        className="resize-none"
                    />
                </div>
            ))}
            {!isSignedOff && (
                <div className="flex justify-end">
                    <Button size="sm" onClick={onSave}>Save</Button>
                </div>
            )}
        </div>
    );
};

const SignOffSection: React.FC<{ patient: Patient; user: User }> = ({ patient, user }) => {
    const { signOffClinicalFile, crossCheckFile, isLoading } = usePatient();

    const handleSignOff = async () => {
        await crossCheckFile(patient.id);
        if (window.confirm("Ready to sign off? This will lock the file.")) {
            signOffClinicalFile(patient.id);
        }
    };

    if (patient.clinicalFile.status === 'signed') {
        return (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                <CheckCircleIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h3 className="text-lg font-bold text-green-800">Clinical File Signed</h3>
                <p className="text-sm text-green-700">By {user.name} on {new Date(patient.clinicalFile.signedAt!).toLocaleString()}</p>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-gray-800 border border-indigo-100 dark:border-indigo-800 rounded-xl p-6 flex flex-col items-center justify-center gap-4 shadow-sm">
            <div className="text-center">
                <h3 className="text-lg font-bold">Ready to Finalize?</h3>
                <p className="text-sm text-muted-foreground">AI will cross-check for inconsistencies before signing.</p>
            </div>
            <Button
                onClick={handleSignOff}
                disabled={isLoading}
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg shadow-green-600/20"
            >
                {isLoading ? 'Verifying...' : 'Sign Off & Generate Plan'}
            </Button>
        </div>
    );
};

// --- MAIN LAYOUT ---

const ClinicalFileRedesigned: React.FC<{ patient: Patient }> = ({ patient }) => {
    const { currentUser } = useAuth();
    const [openItem, setOpenItem] = useState<string | undefined>('complaint');

    // Helper to check completion (simplified)
    const isComplete = (section: string) => {
        const h = patient.clinicalFile.sections.history;
        const g = patient.clinicalFile.sections.gpe;
        switch (section) {
            case 'complaint': return !!h?.complaints?.[0]?.symptom;
            case 'hpi': return !!h?.hpi && h.hpi.length > 10;
            case 'symptoms': return (h?.associated_symptoms?.length || 0) > 0;
            case 'allergies': return (h?.allergy_history?.length || 0) > 0;
            case 'gpe': return !!g?.general_appearance;
            default: return false;
        }
    };

    const handleSave = (nextSection?: string) => {
        // In a real app, we might show a toast here
        if (nextSection) {
            setOpenItem(nextSection);
        } else {
            setOpenItem(undefined); // Collapse all
        }
    };

    const sections = [
        { id: 'complaint', label: 'Presenting Complaint', Component: ComplaintSection },
        { id: 'hpi', label: 'History of Present Illness', Component: HPISection },
        { id: 'symptoms', label: 'Associated Symptoms', Component: AssociatedSymptomsSection },
        { id: 'history', label: 'Medical History', Component: HistoryGridSection },
        { id: 'allergies', label: 'Allergies', Component: AllergiesSection },
        { id: 'gpe', label: 'General Physical Exam', Component: GPESection },
        { id: 'systemic', label: 'Systemic Exam', Component: SystemicSection },
    ];

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-10 py-10 space-y-8">
                <Accordion type="single" collapsible value={openItem} onValueChange={setOpenItem} className="space-y-4">
                    {sections.map(({ id, label, Component }, index) => {
                        const completed = isComplete(id);
                        const nextSectionId = sections[index + 1]?.id;

                        return (
                            <AccordionItem key={id} value={id} className="border border-border/50 rounded-xl bg-card px-6 shadow-sm hover:shadow-md transition-all duration-200">
                                <AccordionTrigger className="hover:no-underline py-6">
                                    <div className="flex items-center gap-3">
                                        {completed ? (
                                            <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                        ) : (
                                            <div className="w-5 h-5 rounded-full border-2 border-muted" />
                                        )}
                                        <span className={cn("font-semibold", completed && "text-green-700 dark:text-green-400")}>{label}</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-2 pb-6">
                                    <Component
                                        patient={patient}
                                        isSignedOff={patient.clinicalFile.status === 'signed'}
                                        onSave={() => handleSave(nextSectionId)}
                                    />
                                </AccordionContent>
                            </AccordionItem>
                        );
                    })}
                </Accordion>

                <div className="pt-4">
                    {currentUser && <SignOffSection patient={patient} user={currentUser} />}
                </div>
            </div>
        </div>
    );
};

export default ClinicalFileRedesigned;
