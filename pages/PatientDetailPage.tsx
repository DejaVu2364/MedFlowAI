

import React, { useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { AppContext } from '../App';
import { AppContextType, Patient, User, TriageLevel, Order, Vitals, OrderStatus, OrderCategory, ClinicalFileSections, Allergy, HistorySectionData, GPESectionData, SystemicExamSectionData, SystemicExamSystemData, AISuggestionHistory, OrderPriority } from '../types';
import { SparklesIcon, CheckBadgeIcon, InformationCircleIcon, DocumentDuplicateIcon, ChevronDownIcon, ChevronUpIcon, XMarkIcon, EllipsisVerticalIcon, PaperAirplaneIcon, PencilIcon, BeakerIcon, FilmIcon, PillIcon, ClipboardDocumentListIcon, UserCircleIcon, SearchIcon } from '../components/icons';
import TextareaAutosize from 'react-textarea-autosize';

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


// --- REUSABLE & NEW COMPONENTS ---

const PatientWorkspaceHeader: React.FC<{ patient: Patient }> = ({ patient }) => {
    const vitals = patient.vitals;
    const prevVitals = patient.vitalsHistory.length > 1 ? patient.vitalsHistory[1] : null;

    const VitalsChip: React.FC<{ label: string, value?: number | string, unit: string, prevValue?: number }> = ({ label, value, unit, prevValue }) => {
        let trend: 'up' | 'down' | 'same' = 'same';
        if (typeof value === 'number' && prevValue) {
            if (value > prevValue) trend = 'up';
            if (value < prevValue) trend = 'down';
        }
        return (
            <div className="text-center">
                <p className="text-xs text-text-tertiary">{label}</p>
                <div className="flex items-center justify-center gap-1">
                     <p className="text-lg font-bold text-text-primary">{value || 'N/A'}{unit}</p>
                     {trend !== 'same' && (
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${trend === 'up' ? 'text-red-500' : 'text-green-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={trend === 'up' ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                        </svg>
                     )}
                </div>
            </div>
        )
    };
    return (
        <div className="p-4 md:p-6 border-b border-border-color">
            <div className="flex flex-col md:flex-row justify-between md:items-center">
                <div>
                    <h2 className="text-3xl md:text-4xl font-bold text-text-primary">{patient.name}</h2>
                    <p className="text-md text-text-tertiary mt-1">
                        {patient.age}, {patient.gender} &middot; ID: {patient.id} &middot; <TriageBadge level={patient.triage.level} />
                    </p>
                </div>
                 <div className="grid grid-cols-3 md:grid-cols-5 gap-4 mt-4 md:mt-0 p-2 bg-background-secondary rounded-lg">
                    <VitalsChip label="Pulse" value={vitals?.hr} unit=" bpm" prevValue={prevVitals?.hr}/>
                    <VitalsChip label="BP" value={`${vitals?.bpSys || 'N/A'}/${vitals?.bpDia || ''}`} unit=" mmHg" prevValue={prevVitals?.bpSys}/>
                    <VitalsChip label="RR" value={vitals?.rr} unit="/min" prevValue={prevVitals?.rr}/>
                    <VitalsChip label="SpO₂" value={vitals?.spo2} unit="%" prevValue={prevVitals?.spo2}/>
                    <VitalsChip label="Temp" value={vitals?.temp} unit="°C" prevValue={prevVitals?.temp}/>
                </div>
            </div>
        </div>
    );
};

const Accordion: React.FC<{ title: string, children: React.ReactNode, isOpenDefault?: boolean, status?: 'green' | 'yellow' | 'red' }> = ({ title, children, isOpenDefault = false, status }) => {
    const [isOpen, setIsOpen] = useState(isOpenDefault);
    const statusClasses = {
        green: 'bg-green-500',
        yellow: 'bg-yellow-400',
        red: 'bg-red-500'
    };
    return (
        <div className="border border-border-color rounded-lg overflow-hidden bg-background-primary">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 bg-background-secondary hover:bg-background-tertiary focus:outline-none"
            >
                <div className="flex items-center gap-3">
                    {status && <span className={`h-2.5 w-2.5 rounded-full ${statusClasses[status]}`}></span>}
                    <h4 className="text-lg font-semibold text-text-primary">{title}</h4>
                </div>
                <svg className={`w-5 h-5 transition-transform transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && <div className="p-4 border-t border-border-color">{children}</div>}
        </div>
    );
};

const AIActionButton: React.FC<{ onClick: () => void, text: string, isLoading?: boolean }> = ({ onClick, text, isLoading }) => (
    <button onClick={onClick} disabled={isLoading} className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900/80">
        <SparklesIcon /> {isLoading ? 'Working...' : text}
    </button>
);

const TagsInput: React.FC<{ tags: string[]; onTagsChange: (tags: string[]) => void; disabled: boolean }> = ({ tags, onTagsChange, disabled }) => {
    const [inputValue, setInputValue] = useState('');

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const newTag = inputValue.trim();
            if (newTag && !tags.includes(newTag)) {
                onTagsChange([...tags, newTag]);
            }
            setInputValue('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        onTagsChange(tags.filter(tag => tag !== tagToRemove));
    };

    return (
        <div className={`w-full flex flex-wrap items-center gap-2 p-2 border border-border-color rounded-md ${disabled ? 'bg-background-tertiary' : ''}`}>
            {tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full dark:bg-blue-900/50 dark:text-blue-300">
                    {tag}
                    {!disabled && <button onClick={() => removeTag(tag)} className="text-blue-500 hover:text-blue-700">&times;</button>}
                </span>
            ))}
            <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                className="flex-grow bg-transparent focus:outline-none text-sm text-input-text"
                placeholder="Add symptoms..."
            />
        </div>
    );
};

// --- TAB COMPONENTS ---

const OverviewTab: React.FC<{ patient: Patient }> = ({ patient }) => {
    const { generatePatientOverview, isLoading } = useContext(AppContext) as AppContextType;
    
    useEffect(() => {
        if (!patient.overview) {
            generatePatientOverview(patient.id);
        }
    }, [patient.id, patient.overview, generatePatientOverview]);

    if (isLoading && !patient.overview) {
        return <div className="p-8 text-center">Generating AI Overview...</div>
    }

    if (!patient.overview) {
        return <div className="p-8 text-center text-text-tertiary">Could not load patient overview.</div>
    }
    
    return (
        <div className="p-4 md:p-6 space-y-4">
            <h3 className="text-2xl font-bold text-text-primary">At-a-Glance Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-background-primary p-4 rounded-lg border border-border-color">
                    <h4 className="font-semibold text-text-secondary">Chief Complaint</h4>
                    <p>{patient.complaint}</p>
                </div>
                 <div className="bg-background-primary p-4 rounded-lg border border-border-color">
                    <h4 className="font-semibold text-text-secondary">AI Summary</h4>
                    <p className="italic">{patient.overview.summary}</p>
                </div>
                 <div className="bg-background-primary p-4 rounded-lg border border-border-color">
                    <h4 className="font-semibold text-text-secondary">Vitals Snapshot</h4>
                    <p>{patient.overview.vitalsSnapshot}</p>
                </div>
                 <div className="bg-background-primary p-4 rounded-lg border border-border-color">
                    <h4 className="font-semibold text-text-secondary">Active Orders</h4>
                    <p>{patient.overview.activeOrders}</p>
                </div>
                 <div className="bg-background-primary p-4 rounded-lg border border-border-color col-span-1 md:col-span-2">
                    <h4 className="font-semibold text-text-secondary">Recent Results</h4>
                    <p>{patient.overview.recentResults}</p>
                </div>
            </div>
        </div>
    );
};

// --- CLINICAL FILE SUB-SECTIONS ---
const AIFormatSuggestionChips: React.FC<{ patient: Patient }> = ({ patient }) => {
    const { acceptAISuggestion, clearAISuggestions } = useContext(AppContext) as AppContextType;
    const suggestions = patient.clinicalFile.aiSuggestions?.history;

    if (!suggestions || Object.keys(suggestions).filter(k => k !== 'followUpQuestions' && k !== 'followUpAnswers').length === 0) {
        return null;
    }
    
    const handleAccept = (field: keyof AISuggestionHistory) => {
        acceptAISuggestion(patient.id, field);
    };
    
    const renderSuggestion = (field: keyof AISuggestionHistory, label: string, value: any) => {
        if (!value) return null;
        
        let displayValue: string;
        if (Array.isArray(value)) {
            if (field === 'allergy_history') {
                 displayValue = (value as Allergy[]).map(a => `${a.substance} (${a.reaction})`).join(', ');
            } else {
                displayValue = value.join(', ');
            }
        } else {
            displayValue = String(value);
        }

        return (
            <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md">
                <div className="flex-grow">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-300">{label}</span>
                    <p className="text-sm text-text-primary">{displayValue}</p>
                </div>
                <button onClick={() => handleAccept(field)} className="text-xs px-2 py-1 bg-brand-green text-white rounded hover:bg-green-700">Accept</button>
            </div>
        )
    };

    return (
        <div className="p-4 my-4 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-lg bg-background-primary space-y-3">
            <div className="flex justify-between items-center">
                <h4 className="font-semibold text-text-secondary flex items-center gap-2"><SparklesIcon/> AI Suggestions from HPI</h4>
                <button onClick={() => clearAISuggestions(patient.id, 'history')} className="text-xs text-text-tertiary hover:underline">Dismiss All</button>
            </div>
            {renderSuggestion('chief_complaint', 'Chief Complaint', suggestions.chief_complaint)}
            {renderSuggestion('duration', 'Duration', suggestions.duration)}
            {renderSuggestion('associated_symptoms', 'Associated Symptoms', suggestions.associated_symptoms)}
            {renderSuggestion('past_medical_history', 'Past Medical History', suggestions.past_medical_history)}
            {renderSuggestion('allergy_history', 'Allergies', suggestions.allergy_history)}
            {renderSuggestion('family_history', 'Family History', suggestions.family_history)}
        </div>
    );
};

const AIHistoryHelper: React.FC<{
    patient: Patient;
    sectionKey: 'history';
    fieldKey: keyof HistorySectionData;
    currentValue: string;
}> = ({ patient, sectionKey, fieldKey, currentValue }) => {
    const { getFollowUpQuestions, updateFollowUpAnswer, composeHistoryWithAI } = useContext(AppContext) as AppContextType;
    const [isLoading, setIsLoading] = useState(false);

    const suggestions = patient.clinicalFile.aiSuggestions?.history;
    const questions = suggestions?.followUpQuestions?.[fieldKey];
    const answers = suggestions?.followUpAnswers?.[fieldKey] || {};

    const handleSuggest = async () => {
        setIsLoading(true);
        await getFollowUpQuestions(patient.id, sectionKey, fieldKey, currentValue);
        setIsLoading(false);
    };

    const handleCompose = async () => {
        setIsLoading(true);
        await composeHistoryWithAI(patient.id, sectionKey, fieldKey);
        setIsLoading(false);
    };
    
    const allAnswered = questions && questions.every(q => answers[q.id]);

    if (!questions) {
        return (
            <div className="text-right mt-1 p-2">
                <AIActionButton onClick={handleSuggest} text="Suggest Questions" isLoading={isLoading} />
            </div>
        );
    }
    
    return (
        <div className="mt-2 p-3 border-t border-dashed border-border-color space-y-3">
            <h5 className="text-xs font-bold text-text-secondary uppercase">AI Follow-up</h5>
            {questions.map(q => (
                <div key={q.id} className="text-sm">
                    <p className="font-semibold text-text-secondary">{q.text}</p>
                    <p className="text-xs text-text-tertiary italic mb-1">{q.rationale}</p>
                    {q.answer_type === 'options' && q.quick_options ? (
                        <div className="flex flex-wrap gap-2">
                            {q.quick_options.map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => updateFollowUpAnswer(patient.id, fieldKey, q.id, opt)}
                                    className={`px-2 py-1 text-xs rounded-md ${answers[q.id] === opt ? 'bg-brand-blue text-white' : 'bg-background-tertiary hover:bg-border-color text-text-secondary'}`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    ) : (
                         <input
                            type="text"
                            onBlur={(e) => updateFollowUpAnswer(patient.id, fieldKey, q.id, e.target.value)}
                            defaultValue={answers[q.id] || ''}
                            placeholder="Type answer..."
                            className="w-full mt-1 p-1 text-sm border border-border-color rounded-md bg-background-primary text-input-text"
                         />
                    )}
                </div>
            ))}

            {allAnswered && (
                 <div className="text-right pt-2">
                     <AIActionButton onClick={handleCompose} text="Compose Paragraph" isLoading={isLoading} />
                 </div>
            )}
        </div>
    );
};

const AIAssistedTextarea: React.FC<{
    patient: Patient;
    fieldKey: keyof HistorySectionData;
    label: string;
    isSignedOff: boolean;
    minRows?: number;
}> = ({ patient, fieldKey, label, isSignedOff, minRows = 2 }) => {
    const { updateClinicalFileSection } = useContext(AppContext) as AppContextType;
    const history = patient.clinicalFile.sections.history || {};
    const currentValue = (history[fieldKey] as string) || '';

    const handleChange = (value: string) => {
        updateClinicalFileSection(patient.id, 'history', { [fieldKey]: value });
    };

    return (
        <div>
            <label className="text-sm font-semibold text-text-secondary">{label}</label>
            <div className="mt-1 border border-border-color rounded-md focus-within:ring-1 focus-within:ring-brand-blue focus-within:border-brand-blue overflow-hidden">
                <TextareaAutosize
                    minRows={minRows}
                    value={currentValue}
                    onChange={e => handleChange(e.target.value)}
                    disabled={isSignedOff}
                    className="w-full p-2 border-0 rounded-md disabled:bg-background-tertiary bg-background-primary text-input-text focus:ring-0"
                />
                {!isSignedOff && currentValue.trim().length > 5 && (
                    <AIHistoryHelper
                        patient={patient}
                        sectionKey="history"
                        fieldKey={fieldKey}
                        currentValue={currentValue}
                    />
                )}
            </div>
        </div>
    );
};

const HistorySection: React.FC<{ patient: Patient; isSignedOff: boolean }> = ({ patient, isSignedOff }) => {
    const { updateClinicalFileSection, formatHpi, checkMissingInfo, summarizeSection } = useContext(AppContext) as AppContextType;
    const history = patient.clinicalFile.sections.history || {};

    const handleFieldChange = (field: keyof HistorySectionData, value: any) => {
        updateClinicalFileSection(patient.id, 'history', { [field]: value });
    };

    const handleAllergyChange = (index: number, field: keyof Allergy, value: string) => {
        const newAllergies = [...(history.allergy_history || [])];
        newAllergies[index] = { ...newAllergies[index], [field]: value };
        handleFieldChange('allergy_history', newAllergies);
    };
    
    const addAllergy = () => {
        const newAllergies = [...(history.allergy_history || []), { substance: '', reaction: '', severity: '' }];
        handleFieldChange('allergy_history', newAllergies);
    };
    
    const removeAllergy = (index: number) => {
        const newAllergies = (history.allergy_history || []).filter((_, i) => i !== index);
        handleFieldChange('allergy_history', newAllergies);
    };
    
    const reviewOfSystemsFields = ['Cardiovascular', 'Respiratory', 'Gastrointestinal', 'Genitourinary', 'Neurological', 'Musculoskeletal', 'Dermatological', 'Endocrine', 'Hematological', 'Psychiatric'];
    
    return (
        <div className="space-y-6">
             <div className="flex justify-end gap-2">
                <AIActionButton onClick={() => checkMissingInfo(patient.id, 'history')} text="Check Missing Info" />
                <AIActionButton onClick={() => summarizeSection(patient.id, 'history')} text="Summarize History" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                    <label className="text-sm font-semibold text-text-secondary">Chief Complaint</label>
                    <input type="text" value={history.chief_complaint || ''} onChange={e => handleFieldChange('chief_complaint', e.target.value)} disabled={isSignedOff} className="w-full mt-1 p-2 border border-border-color rounded-md disabled:bg-background-tertiary bg-background-primary text-input-text"/>
                </div>
                <div>
                    <label className="text-sm font-semibold text-text-secondary">Duration</label>
                    <input type="text" value={history.duration || ''} onChange={e => handleFieldChange('duration', e.target.value)} disabled={isSignedOff} className="w-full mt-1 p-2 border border-border-color rounded-md disabled:bg-background-tertiary bg-background-primary text-input-text"/>
                </div>
                <div className="md:col-span-2">
                    <label className="text-sm font-semibold text-text-secondary flex items-center gap-2">History of Present Illness <AIActionButton onClick={() => formatHpi(patient.id)} text="Format Text" /></label>
                    <TextareaAutosize minRows={4} value={history.hpi || ''} onChange={e => handleFieldChange('hpi', e.target.value)} disabled={isSignedOff} className="w-full mt-1 p-2 border border-border-color rounded-md disabled:bg-background-tertiary bg-background-primary text-input-text"/>
                    <AIFormatSuggestionChips patient={patient} />
                </div>
                <div className="md:col-span-2">
                    <label className="text-sm font-semibold text-text-secondary">Associated Symptoms</label>
                    <TagsInput tags={history.associated_symptoms || []} onTagsChange={tags => handleFieldChange('associated_symptoms', tags)} disabled={isSignedOff} />
                </div>
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <AIAssistedTextarea patient={patient} fieldKey="past_medical_history" label="Past Medical History" isSignedOff={isSignedOff} />
                    <AIAssistedTextarea patient={patient} fieldKey="past_surgical_history" label="Past Surgical History" isSignedOff={isSignedOff} />
                    <AIAssistedTextarea patient={patient} fieldKey="drug_history" label="Drug / Medication History" isSignedOff={isSignedOff} />
                    <AIAssistedTextarea patient={patient} fieldKey="family_history" label="Family History" isSignedOff={isSignedOff} />
                    <AIAssistedTextarea patient={patient} fieldKey="personal_social_history" label="Personal & Social History" isSignedOff={isSignedOff} />
                    {patient.gender === 'Female' && (
                       <AIAssistedTextarea patient={patient} fieldKey="menstrual_obstetric_history" label="Menstrual / Obstetric History" isSignedOff={isSignedOff} />
                    )}
                     <AIAssistedTextarea patient={patient} fieldKey="socioeconomic_lifestyle" label="Socioeconomic & Lifestyle" isSignedOff={isSignedOff} />
                </div>
                 <div className="md:col-span-2">
                    <label className="text-sm font-semibold text-text-secondary">Allergies</label>
                    <div className="space-y-2 mt-1">
                        {(history.allergy_history || []).map((allergy, index) => (
                            <div key={index} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                                <input placeholder="Substance" value={allergy.substance} onChange={e => handleAllergyChange(index, 'substance', e.target.value)} disabled={isSignedOff} className="p-2 border border-border-color rounded-md w-full disabled:bg-background-tertiary bg-background-primary text-input-text col-span-2 sm:col-span-1"/>
                                <input placeholder="Reaction" value={allergy.reaction} onChange={e => handleAllergyChange(index, 'reaction', e.target.value)} disabled={isSignedOff} className="p-2 border border-border-color rounded-md w-full disabled:bg-background-tertiary bg-background-primary text-input-text col-span-2 sm:col-span-1"/>
                                <select value={allergy.severity} onChange={e => handleAllergyChange(index, 'severity', e.target.value)} disabled={isSignedOff} className="p-2 border border-border-color rounded-md w-full disabled:bg-background-tertiary bg-background-primary text-input-text">
                                    <option value="">Severity...</option>
                                    <option>Mild</option><option>Moderate</option><option>Severe</option>
                                </select>
                                <button onClick={() => removeAllergy(index)} disabled={isSignedOff} className="text-red-500 hover:text-red-700 disabled:opacity-50 text-sm">Remove</button>
                            </div>
                        ))}
                         {!isSignedOff && <button onClick={addAllergy} className="text-sm text-brand-blue">+ Add Allergy</button>}
                    </div>
                </div>
                 <div className="md:col-span-2">
                    <label className="text-sm font-semibold text-text-secondary">Review of Systems</label>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2">
                        {reviewOfSystemsFields.map(field => (
                             <label key={field} className="flex items-center space-x-2">
                                <input type="checkbox" checked={!!history.review_of_systems?.[field.toLowerCase()]} onChange={() => handleFieldChange('review_of_systems', {...history.review_of_systems, [field.toLowerCase()]: !history.review_of_systems?.[field.toLowerCase()]})} disabled={isSignedOff} className="h-4 w-4 rounded text-brand-blue focus:ring-brand-blue" />
                                <span className="text-sm text-text-secondary">{field}</span>
                            </label>
                        ))}
                    </div>
                     <div className="mt-4">
                        <label className="text-sm font-semibold text-text-secondary">ROS - Other Notes</label>
                         <TextareaAutosize
                            minRows={2}
                            value={history.review_of_systems?.other_notes as string || ''}
                            onChange={e => handleFieldChange('review_of_systems', {...history.review_of_systems, other_notes: e.target.value})}
                            disabled={isSignedOff}
                            className="w-full mt-1 p-2 border border-border-color rounded-md disabled:bg-background-tertiary bg-background-primary text-input-text"
                         />
                    </div>
                </div>
            </div>
        </div>
    );
};

const GPESection: React.FC<{ patient: Patient; isSignedOff: boolean }> = ({ patient, isSignedOff }) => {
    const { updateClinicalFileSection, summarizeSection } = useContext(AppContext) as AppContextType;
    const gpe = patient.clinicalFile.sections.gpe || {};

    const handleFieldChange = (field: keyof GPESectionData, value: any) => {
        updateClinicalFileSection(patient.id, 'gpe', { [field]: value });
    };
    
    const handleFlagsChange = (flag: keyof GPESectionData['flags']) => {
        const newFlags = { ...gpe.flags, [flag]: !gpe.flags?.[flag] };
        updateClinicalFileSection(patient.id, 'gpe', { flags: newFlags });
    };

    const calculateBMI = useCallback(() => {
        if (gpe.height_cm && gpe.weight_kg) {
            const heightM = gpe.height_cm / 100;
            const bmi = gpe.weight_kg / (heightM * heightM);
            if (gpe.bmi?.toFixed(1) !== bmi.toFixed(1)) {
                handleFieldChange('bmi', parseFloat(bmi.toFixed(1)));
            }
        }
    }, [gpe.height_cm, gpe.weight_kg, gpe.bmi]);

    useEffect(calculateBMI, [calculateBMI]);

    const gpeToggles: { key: keyof GPESectionData['flags']; label: string }[] = [
        { key: 'pallor', label: 'Pallor' }, { key: 'icterus', label: 'Icterus' }, { key: 'cyanosis', label: 'Cyanosis' },
        { key: 'clubbing', label: 'Clubbing' }, { key: 'lymphadenopathy', label: 'Lymphadenopathy' }, { key: 'edema', label: 'Edema' },
    ];
    
    return (
        <div className="space-y-4">
             <div className="flex justify-end">
                <AIActionButton onClick={() => summarizeSection(patient.id, 'gpe')} text="Auto-Describe GPE"/>
            </div>
            {gpe.aiGeneratedSummary && (
                <div className="p-3 bg-background-tertiary rounded-md text-sm italic"><strong>AI Description:</strong> {gpe.aiGeneratedSummary}</div>
            )}
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div className="col-span-2">
                     <label className="text-sm font-semibold text-text-secondary">General Appearance</label>
                     <select value={gpe.general_appearance || ''} onChange={e => handleFieldChange('general_appearance', e.target.value)} disabled={isSignedOff} className="w-full mt-1 p-2 border border-border-color rounded-md disabled:bg-background-tertiary bg-background-primary text-input-text">
                        <option value="">Select...</option>
                        <option value="well">Well</option><option value="ill">Ill-looking</option>
                        <option value="toxic">Toxic</option><option value="cachectic">Cachectic</option>
                    </select>
                </div>
                 <div>
                     <label className="text-sm font-semibold text-text-secondary">Height (cm)</label>
                     <input type="number" value={gpe.height_cm || ''} onChange={e => handleFieldChange('height_cm', parseFloat(e.target.value))} disabled={isSignedOff} className="w-full mt-1 p-2 border border-border-color rounded-md disabled:bg-background-tertiary bg-background-primary text-input-text"/>
                 </div>
                 <div>
                     <label className="text-sm font-semibold text-text-secondary">Weight (kg)</label>
                     <input type="number" value={gpe.weight_kg || ''} onChange={e => handleFieldChange('weight_kg', parseFloat(e.target.value))} disabled={isSignedOff} className="w-full mt-1 p-2 border border-border-color rounded-md disabled:bg-background-tertiary bg-background-primary text-input-text"/>
                 </div>
                  <div>
                     <label className="text-sm font-semibold text-text-secondary">BMI (kg/m²)</label>
                     <input type="number" value={gpe.bmi || ''} disabled className="w-full mt-1 p-2 border bg-background-tertiary border-border-color rounded-md text-input-text"/>
                 </div>
            </div>
             <div className="grid grid-cols-3 md:grid-cols-6 gap-4 items-center p-2 border border-border-color rounded-md">
                {gpeToggles.map(({ key, label }) => (
                     <label key={key} className="flex items-center space-x-2">
                        <input type="checkbox" checked={!!gpe.flags?.[key]} onChange={() => handleFlagsChange(key)} disabled={isSignedOff} className="h-4 w-4 rounded text-brand-blue focus:ring-brand-blue disabled:bg-background-tertiary" />
                        <span className="text-sm font-medium text-text-secondary">{label}</span>
                    </label>
                ))}
            </div>
        </div>
    );
};

const SystemicExamSection: React.FC<{ patient: Patient; isSignedOff: boolean }> = ({ patient, isSignedOff }) => {
    const { updateClinicalFileSection, summarizeSection } = useContext(AppContext) as AppContextType;
    
    const systems: { key: keyof SystemicExamSectionData; label: string }[] = [
        { key: 'cvs', label: 'Cardiovascular (CVS)' }, { key: 'rs', label: 'Respiratory (RS)' },
        { key: 'abdomen', label: 'Abdomen' }, { key: 'cns', label: 'Central Nervous System (CNS)' }, 
        { key: 'msk', label: 'Musculoskeletal (MSK)' }, { key: 'skin', label: 'Skin & Integument' },
    ];
    
    const SystemPanel: React.FC<{ systemKey: keyof SystemicExamSectionData; systemLabel: string; }> = ({ systemKey, systemLabel }) => {
        const systemData = patient.clinicalFile.sections.systemic?.[systemKey] || {};
        
        const handleFieldChange = (field: keyof SystemicExamSystemData, value: string) => {
            const updatedSystemData = { ...systemData, [field]: value };
            updateClinicalFileSection(patient.id, 'systemic', { [systemKey]: updatedSystemData });
        };
        
        const handleAutofillNormal = () => {
             const normalFindings = { inspection: 'Normal', palpation: 'Normal', percussion: 'Normal', auscultation: 'Normal', summary: 'No abnormal findings.', autofill: true };
             updateClinicalFileSection(patient.id, 'systemic', { [systemKey]: normalFindings });
        };

        const fields: (keyof SystemicExamSystemData)[] = ['inspection', 'palpation', 'percussion', 'auscultation', 'summary'];
        
        return (
            <Accordion title={systemLabel}>
                <div className="space-y-4">
                    <div className="text-right">
                        <button onClick={handleAutofillNormal} disabled={isSignedOff} className="text-xs px-2.5 py-1 bg-background-tertiary text-text-secondary rounded-md hover:bg-border-color disabled:opacity-50">Autofill Normal</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {fields.map(field => (
                            <div key={field} className={field === 'summary' ? 'md:col-span-2' : ''}>
                                <label className="text-sm font-semibold text-text-secondary capitalize">{field}</label>
                                <TextareaAutosize
                                    minRows={field === 'summary' ? 2 : 1}
                                    value={systemData[field] || ''}
                                    onChange={e => handleFieldChange(field, e.target.value)}
                                    disabled={isSignedOff}
                                    className="w-full mt-1 p-2 border border-border-color rounded-md focus:ring-brand-blue focus:border-brand-blue disabled:bg-background-tertiary bg-background-primary text-input-text"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </Accordion>
        );
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <AIActionButton onClick={() => summarizeSection(patient.id, 'systemic')} text="Summarize All Systems" />
            </div>
            {systems.map(({ key, label }) => <SystemPanel key={key} systemKey={key} systemLabel={label} />)}
        </div>
    );
};

const SummarySignoffSection: React.FC<{ patient: Patient; user: User }> = ({ patient, user }) => {
    const { signOffClinicalFile, summarizePatientClinicalFile, crossCheckFile, isLoading } = useContext(AppContext) as AppContextType;

    useEffect(() => {
        if (!patient.clinicalFile.aiSummary) {
            summarizePatientClinicalFile(patient.id);
        }
    }, [patient.id, patient.clinicalFile.aiSummary, summarizePatientClinicalFile]);

    const handleSignOff = async () => {
        await crossCheckFile(patient.id);
    };

    useEffect(() => {
        // This effect runs after crossCheckFile updates the state
        const inconsistencies = patient.clinicalFile.crossCheckInconsistencies;
        if (inconsistencies && inconsistencies.length > 0) {
            const confirmed = window.confirm(`AI Cross-Check Found Potential Issues:\n\n- ${inconsistencies.join('\n- ')}\n\nDo you want to proceed with sign-off anyway?`);
            if (confirmed) {
                signOffClinicalFile(patient.id);
            }
        } else if (inconsistencies) { // inconsistencies is an empty array, meaning check was run and passed
            signOffClinicalFile(patient.id);
        }
    }, [patient.clinicalFile.crossCheckInconsistencies]);


    if (patient.clinicalFile.status === 'signed') {
         return (
            <div className="flex items-center gap-2 text-green-600 bg-green-100 px-3 py-4 rounded-lg mt-6 justify-center">
                <CheckBadgeIcon />
                <span className="font-semibold text-sm">Signed Off by {patient.clinicalFile.signedBy === user.id ? 'you' : 'Doctor'} on {new Date(patient.clinicalFile.signedAt || '').toLocaleDateString()}</span>
            </div>
        );
    }
    
    return (
        <div className="mt-6 p-4 bg-background-tertiary rounded-lg border border-border-color">
            <h4 className="font-semibold text-text-secondary">AI Summary & Sign-off</h4>
            <div className="my-2 p-3 bg-background-primary rounded border border-border-color">
                <p className="text-sm text-text-secondary italic">
                    {patient.clinicalFile.aiSummary || "AI summary is being generated..."}
                </p>
                 {patient.clinicalFile.missingInfo && patient.clinicalFile.missingInfo.length > 0 && (
                     <div className="mt-2 text-xs text-yellow-700">
                         <strong className="font-bold">Missing Info:</strong> {patient.clinicalFile.missingInfo.join(', ')}
                     </div>
                 )}
            </div>
            <div className="flex justify-end gap-2 mt-4">
                <button disabled={true} className="px-4 py-2 text-sm font-medium text-text-secondary bg-background-primary border border-border-color rounded-md hover:bg-background-tertiary disabled:opacity-50">Discard Draft</button>
                <button onClick={handleSignOff} disabled={isLoading || user.role !== 'Doctor'} className="px-6 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                    {isLoading ? 'Processing...' : 'Sign Off'}
                </button>
            </div>
             {user.role !== 'Doctor' && <p className="text-xs text-right mt-1 text-text-tertiary">Only a Doctor can sign off the clinical file.</p>}
        </div>
    );
};

const ClinicalFileTab: React.FC<{ patient: Patient; user: User }> = ({ patient, user }) => {
    const isSignedOff = patient.clinicalFile.status === 'signed';

    return (
        <div className="p-4 md:p-6 space-y-4">
            <Accordion title="History" isOpenDefault={true} status="yellow">
                <HistorySection patient={patient} isSignedOff={isSignedOff} />
            </Accordion>
            <Accordion title="General Physical Examination (GPE)">
                <GPESection patient={patient} isSignedOff={isSignedOff} />
            </Accordion>
            <Accordion title="Systemic Examination">
                <SystemicExamSection patient={patient} isSignedOff={isSignedOff} />
            </Accordion>
            <SummarySignoffSection patient={patient} user={user} />
        </div>
    );
};

// --- NEW ORDERS TAB AND COMPONENTS ---

const OrdersHeader: React.FC<{ onQuickOrder: (label: string) => void; activeCategory: OrderCategory }> = ({ onQuickOrder, activeCategory }) => {
    const [quickOrderText, setQuickOrderText] = useState('');
    const inputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '/') {
                if(document.activeElement?.tagName.toLowerCase() !== 'input' && document.activeElement?.tagName.toLowerCase() !== 'textarea') {
                    e.preventDefault();
                    inputRef.current?.focus();
                }
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                alert('Templates modal would open here.');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && quickOrderText.trim()) {
            onQuickOrder(quickOrderText.trim());
            setQuickOrderText('');
        }
    };

    return (
        <div className="p-4 bg-background-primary rounded-t-lg border-b border-border-color flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-1/2">
                <input
                    ref={inputRef}
                    type="text"
                    value={quickOrderText}
                    onChange={e => setQuickOrderText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type to order (e.g., CBC, Chest X-ray)... Press Enter to add."
                    className="w-full p-2 pl-8 border border-border-color rounded-md bg-background-secondary text-input-text focus:ring-2 focus:ring-brand-blue"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-2 text-text-tertiary text-xs border-r border-border-color pr-2 mr-2">/</div>
            </div>
            <div className="flex gap-2">
                 <button 
                    onClick={() => alert(`New ${activeCategory} modal would open.`)}
                    className="px-3 py-1.5 text-sm font-semibold text-white bg-brand-green rounded-md hover:bg-green-700"
                >
                    + New <span className="capitalize ml-1">{activeCategory}</span>
                </button>
                <button onClick={() => alert('Templates modal would open here.')} className="px-3 py-1.5 text-sm font-semibold text-text-secondary bg-background-tertiary rounded-md hover:bg-border-color">Templates (Ctrl+K)</button>
                <button className="px-3 py-1.5 text-sm font-semibold text-white bg-brand-blue rounded-md hover:bg-brand-blue-dark">Fetch AI Suggestions</button>
            </div>
        </div>
    );
};

const SuggestionPanel: React.FC<{ suggestions: Order[], onAccept: (id: string) => void, onDismiss: (id: string) => void }> = ({ suggestions, onAccept, onDismiss }) => {
    const [isOpen, setIsOpen] = useState(true);

    const handleKeyDown = (e: React.KeyboardEvent, orderId: string) => {
        if (e.key.toUpperCase() === 'A') {
            e.preventDefault();
            onAccept(orderId);
        }
    };

    if (suggestions.length === 0) return null;

    return (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-3 font-semibold text-blue-800 dark:text-blue-300">
                <div className="flex items-center gap-2">
                    <SparklesIcon /> AI Suggestions ({suggestions.length})
                </div>
                {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
            </button>
            {isOpen && (
                <div className="p-3 border-t border-blue-200 dark:border-blue-700 space-y-2">
                    {suggestions.map(order => (
                        <div 
                            key={order.orderId}
                            tabIndex={0}
                            onKeyDown={e => handleKeyDown(e, order.orderId)}
                            className="bg-background-primary p-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold text-text-primary">{order.label}</p>
                                    <p className="text-xs text-text-tertiary capitalize">{order.category} &middot; {order.priority}</p>
                                </div>
                                <div className="flex gap-1.5">
                                    <button onClick={() => onAccept(order.orderId)} title="Accept (A)" className="p-1 text-green-600 hover:bg-green-100 rounded-full"><CheckBadgeIcon /></button>
                                    <button title="Edit" className="p-1 text-text-tertiary hover:bg-background-tertiary rounded-full"><PencilIcon /></button>
                                    <button onClick={() => onDismiss(order.orderId)} title="Dismiss" className="p-1 text-red-600 hover:bg-red-100 rounded-full"><XMarkIcon /></button>
                                </div>
                            </div>
                            {order.ai_provenance?.rationale && (
                                <p className="mt-1 text-xs text-text-secondary italic border-l-2 border-blue-200 pl-2">
                                    {order.ai_provenance.rationale}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const CategoryTabs: React.FC<{ orders: Order[], activeCategory: OrderCategory, setActiveCategory: (c: OrderCategory) => void }> = ({ orders, activeCategory, setActiveCategory }) => {
    const categories: OrderCategory[] = ['investigation', 'radiology', 'medication', 'procedure', 'nursing', 'referral'];
    const orderCounts = useMemo(() => {
        return categories.reduce((acc, cat) => {
            acc[cat] = orders.filter(o => o.category === cat && o.status !== 'draft').length;
            return acc;
        }, {} as Record<OrderCategory, number>);
    }, [orders]);

    return (
        <div className="border-b border-border-color">
            <div className="flex justify-between items-center px-4">
                <nav className="-mb-px flex space-x-4 overflow-x-auto">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`py-3 px-1 text-sm font-semibold whitespace-nowrap flex items-center gap-2 ${activeCategory === cat ? 'text-brand-blue border-b-2 border-brand-blue' : 'text-text-tertiary hover:text-text-secondary'}`}
                        >
                            <span className="capitalize">{cat}</span>
                            {orderCounts[cat] > 0 && <span className="text-xs bg-background-tertiary px-1.5 py-0.5 rounded-full">{orderCounts[cat]}</span>}
                        </button>
                    ))}
                </nav>
                <div className="relative w-full max-w-xs ml-4 hidden md:block">
                     <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-text-tertiary">
                        <SearchIcon />
                    </span>
                    <input
                        type="text"
                        placeholder={`Search in ${activeCategory}...`}
                        className="w-full py-1.5 pl-8 pr-3 text-sm border border-border-color rounded-md bg-background-primary text-input-text focus:ring-1 focus:ring-brand-blue"
                    />
                </div>
            </div>
        </div>
    );
};

const OrderCard: React.FC<{ order: Order }> = ({ order }) => {
    const categoryIcons: Record<OrderCategory, React.ReactNode> = {
        investigation: <BeakerIcon />,
        radiology: <FilmIcon />,
        medication: <PillIcon />,
        procedure: <ClipboardDocumentListIcon />,
        nursing: <UserCircleIcon />,
        referral: <PaperAirplaneIcon />,
    };
    const priorityColors: Record<OrderPriority, string> = {
        STAT: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        urgent: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        routine: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    };
    const statusColors: Record<OrderStatus, string> = {
        draft: 'bg-gray-100 text-gray-800 dark:bg-neutral-700 dark:text-neutral-200',
        sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        scheduled: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
        in_progress: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
        completed: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        resulted: 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300',
        cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    };
    
    const formatPayload = (order: Order) => {
        const { payload, category } = order;
        switch(category) {
            case 'medication': return `${payload.dose} ${payload.route}, ${payload.frequency}`;
            case 'radiology': return `${payload.modality || ''} ${payload.region || ''} ${payload.contrast ? 'w/ contrast' : ''}`;
            default: return order.subType;
        }
    };
    
    return (
        <div className="bg-background-primary p-3 rounded-lg border border-border-color shadow-sm">
            <div className="flex justify-between items-start gap-3">
                <div className="flex items-start gap-3 flex-grow">
                    <span className="text-text-tertiary mt-0.5">{categoryIcons[order.category]}</span>
                    <div>
                        <p className="font-bold text-text-primary">{order.label}</p>
                        <p className="text-sm text-text-secondary">{formatPayload(order)}</p>
                    </div>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2">
                    <div className="flex flex-col items-end gap-1">
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${priorityColors[order.priority]}`}>{order.priority}</span>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${statusColors[order.status]}`}>{order.status.replace('_', ' ')}</span>
                    </div>
                    <button onClick={() => alert("Menu clicked")} className="p-1 text-text-tertiary hover:bg-background-tertiary rounded-full"><EllipsisVerticalIcon /></button>
                </div>
            </div>
             <div className="flex justify-between items-center mt-2 pt-2 border-t border-border-color">
                <p className="text-xs text-text-tertiary">
                   {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <div className="flex items-center gap-2">
                     {order.status === 'draft' && <button className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 bg-brand-blue text-white rounded-md hover:bg-brand-blue-dark"><PaperAirplaneIcon /> Send</button>}
                     {order.status === 'resulted' && <button className="px-3 py-1 text-xs font-semibold text-white bg-brand-green rounded-full hover:bg-green-700">View Result</button>}
                </div>
            </div>
        </div>
    );
};

const OrdersList: React.FC<{ patient: Patient; orders: Order[], activeCategory: OrderCategory }> = ({ patient, orders, activeCategory }) => {
    const { sendAllDrafts } = useContext(AppContext) as AppContextType;
    
    const draftOrders = useMemo(() => orders.filter(o => o.status === 'draft'), [orders]);
    const otherOrders = useMemo(() => orders.filter(o => o.status !== 'draft'), [orders]);

    const statusOrder: OrderStatus[] = ['sent', 'scheduled', 'in_progress', 'completed', 'resulted', 'cancelled'];
    const groupedOrders = useMemo(() => {
        const groups = otherOrders.reduce((acc, order) => {
            (acc[order.status] = acc[order.status] || []).push(order);
            return acc;
        }, {} as Record<OrderStatus, Order[]>);
        return Object.fromEntries(Object.entries(groups).sort(([a], [b]) => statusOrder.indexOf(a as OrderStatus) - statusOrder.indexOf(b as OrderStatus)));
    }, [otherOrders]);

    if (orders.length === 0) {
        return <div className="p-8 text-center text-text-tertiary">No orders for this category.</div>;
    }

    return (
        <div className="space-y-4">
             {draftOrders.length > 0 && (
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-text-secondary capitalize">Draft ({draftOrders.length})</h4>
                        <button 
                            onClick={() => sendAllDrafts(patient.id, activeCategory)}
                            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 bg-brand-blue text-white rounded-md hover:bg-brand-blue-dark"
                        >
                            <PaperAirplaneIcon /> Send All Drafts (Shift+S)
                        </button>
                    </div>
                    <div className="space-y-2">
                        {draftOrders.map(order => <OrderCard key={order.orderId} order={order} />)}
                    </div>
                </div>
            )}
            {Object.entries(groupedOrders).map(([status, ordersInGroup]) => (
                <div key={status}>
                    <h4 className="font-semibold text-text-secondary capitalize mb-2">{status.replace('_', ' ')} ({ordersInGroup.length})</h4>
                    <div className="space-y-2">
                        {ordersInGroup.map(order => <OrderCard key={order.orderId} order={order} />)}
                    </div>
                </div>
            ))}
        </div>
    );
};

const OrdersTab: React.FC<{ patient: Patient; user: User }> = ({ patient, user }) => {
    const { updateOrder, sendAllDrafts, addOrderToPatient } = useContext(AppContext) as AppContextType;
    const [activeCategory, setActiveCategory] = useState<OrderCategory>('investigation');

     useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.shiftKey && e.key.toUpperCase() === 'S') {
                e.preventDefault();
                const draftsInCategory = patient.orders.filter(o => o.category === activeCategory && o.status === 'draft');
                if (draftsInCategory.length > 0) {
                    if (window.confirm(`Send all ${draftsInCategory.length} draft orders for ${activeCategory}?`)) {
                        sendAllDrafts(patient.id, activeCategory);
                    }
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [patient.id, activeCategory, patient.orders, sendAllDrafts]);

    if (patient.clinicalFile.status !== 'signed') {
        return (
            <div className="p-8 text-center text-text-tertiary">
                <p className="font-semibold">Orders are locked.</p>
                <p>Please complete and sign off the Clinical File to manage orders.</p>
            </div>
        );
    }
    
    const aiSuggestions = patient.orders.filter(o => o.status === 'draft' && o.ai_provenance?.rationale);
    const ordersForCategory = patient.orders.filter(o => o.category === activeCategory);

    const handleAcceptSuggestion = (orderId: string) => {
        updateOrder(patient.id, orderId, { status: 'sent' });
    };

    const handleDismissSuggestion = (orderId: string) => {
        // Here we could update status to 'cancelled' or just remove it.
        // For now, let's treat dismiss as cancel.
        updateOrder(patient.id, orderId, { status: 'cancelled' });
    };

    const handleQuickOrder = (label: string) => {
        addOrderToPatient(patient.id, {
            label: label,
            subType: label,
            category: activeCategory,
        });
        alert(`Draft created for "${label}" - edit or Send.`);
    };

    return (
        <div className="space-y-4">
            <OrdersHeader onQuickOrder={handleQuickOrder} activeCategory={activeCategory} />
            <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <CategoryTabs orders={patient.orders} activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
                    <OrdersList patient={patient} orders={ordersForCategory} activeCategory={activeCategory} />
                </div>
                <div className="space-y-4">
                    <SuggestionPanel suggestions={aiSuggestions} onAccept={handleAcceptSuggestion} onDismiss={handleDismissSuggestion} />
                    {/* Placeholder for Templates */}
                    <div className="p-4 bg-background-primary rounded-lg border border-border-color text-center text-text-tertiary">Templates Panel</div>
                </div>
            </div>
        </div>
    );
};


const RoundsTab: React.FC<{ patient: Patient }> = ({ patient }) => {
    const { addRoundToPatient, isLoading } = useContext(AppContext) as AppContextType;
    const [note, setNote] = useState('');
    
    const handleAddRound = async () => {
        if (note.trim()) {
            await addRoundToPatient(patient.id, note);
            setNote('');
        }
    };
     return (
        <div className="p-4 md:p-6 space-y-4">
            <h3 className="text-2xl font-bold text-text-primary">Rounds</h3>
             <div className="bg-background-primary p-4 rounded-lg border border-border-color space-y-2">
                <label className="font-semibold text-text-secondary">New Round Progress Note</label>
                <TextareaAutosize minRows={3} value={note} onChange={e => setNote(e.target.value)} className="w-full p-2 border border-border-color rounded-md bg-background-primary text-input-text" placeholder="Enter today's notes..."/>
                <div className="text-right">
                    <button onClick={handleAddRound} disabled={isLoading} className="px-4 py-2 text-sm font-semibold text-white bg-brand-blue rounded-md hover:bg-brand-blue-dark disabled:bg-gray-400">
                        {isLoading ? 'Saving...' : 'Sign Off Round'}
                    </button>
                </div>
            </div>
            
            <div className="space-y-3">
                {patient.rounds.map(round => (
                    <div key={round.id} className="bg-background-primary p-4 rounded-lg shadow-sm border border-border-color">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-bold text-lg">Round #{round.roundNumber}</h4>
                            <p className="text-xs text-text-tertiary">{new Date(round.timestamp).toLocaleString()}</p>
                        </div>
                        <div className="text-sm space-y-2">
                            <p><strong className="font-semibold text-text-secondary">Vitals:</strong> HR {round.vitalsSnapshot.hr}, BP {round.vitalsSnapshot.bpSys}/{round.vitalsSnapshot.bpDia}, SpO₂ {round.vitalsSnapshot.spo2}%</p>
                            <p><strong className="font-semibold text-text-secondary">AI Summary:</strong> <span className="italic">{round.summaryText}</span></p>
                            <p><strong className="font-semibold text-text-secondary">Notes:</strong> {round.doctorNotes}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const VitalsTab: React.FC<{ patient: Patient }> = ({ patient }) => {
    const { addVitalsRecord } = useContext(AppContext) as AppContextType;
    const [vitals, setVitals] = useState<Vitals>({ hr: 0, bpSys: 0, bpDia: 0, rr: 0, spo2: 0, temp: 0 });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setVitals(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addVitalsRecord(patient.id, vitals);
        setVitals({ hr: 0, bpSys: 0, bpDia: 0, rr: 0, spo2: 0, temp: 0 }); // Reset form
    };

    return (
        <div className="p-4 md:p-6 space-y-6">
            <h3 className="text-2xl font-bold text-text-primary">Vitals</h3>
            {/* Vitals Summary Table */}
            <div className="bg-background-primary p-4 rounded-lg shadow-sm border border-border-color">
                <h4 className="font-semibold mb-2 text-text-secondary">Latest Readings</h4>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-center">
                    {Object.entries({ hr: 'Pulse', bpSys: 'BP', rr: 'RR', spo2: 'SpO₂', temp: 'Temp' }).map(([key, label]) => (
                        <div key={key}>
                            <p className="text-sm text-text-tertiary">{label}</p>
                            <p className="text-xl font-bold text-text-primary">
                                {key === 'bpSys' ? `${patient.vitals?.bpSys || 'N/A'}/${patient.vitals?.bpDia || ''}` : patient.vitals?.[key as keyof Vitals] || 'N/A'}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Add New Vitals Form */}
            <form onSubmit={handleSubmit} className="bg-background-primary p-4 rounded-lg shadow-sm border border-border-color space-y-4">
                 <h4 className="font-semibold text-text-secondary">Add New Entry</h4>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries({ hr: 'HR', bpSys: 'BP Sys', bpDia: 'BP Dia', rr: 'RR', spo2: 'SpO₂', temp: 'Temp' }).map(([key, label]) => (
                        <div key={key}>
                            <label className="block text-sm font-medium text-text-secondary">{label}</label>
                            <input type="number" name={key} value={vitals[key as keyof Vitals] > 0 ? vitals[key as keyof Vitals] : ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-border-color rounded-md bg-background-primary text-input-text" required />
                        </div>
                    ))}
                </div>
                <div className="text-right">
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-brand-blue rounded-md">Add Vitals Entry</button>
                </div>
            </form>

            {/* Vitals History */}
             <div>
                <h4 className="text-lg font-semibold text-text-secondary mb-2">Trend Chart</h4>
                <div className="bg-background-primary p-8 rounded-lg shadow-sm border border-border-color text-center text-text-tertiary">
                    Vital trend charts would be displayed here.
                </div>
            </div>
        </div>
    );
};

const DischargeTab: React.FC<{ patient: Patient }> = ({ patient }) => {
    const { generateDischargeSummary, isLoading } = useContext(AppContext) as AppContextType;
    const [summary, setSummary] = useState(patient.dischargeSummary?.draft || '');

    useEffect(() => {
        setSummary(patient.dischargeSummary?.draft || '');
    }, [patient.dischargeSummary]);

    return (
        <div className="p-4 md:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                 <h3 className="text-2xl font-bold text-text-primary">Discharge</h3>
                 <button onClick={() => generateDischargeSummary(patient.id)} disabled={isLoading} className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900/80">
                    <SparklesIcon /> {isLoading ? 'Compiling...' : 'Compile AI Draft'}
                 </button>
            </div>
            <TextareaAutosize
                minRows={15}
                value={summary}
                onChange={e => setSummary(e.target.value)}
                className="w-full p-3 border border-border-color rounded-lg bg-background-primary text-input-text"
                placeholder="Click 'Compile AI Draft' to generate a summary or start writing..."
            />
            <div className="text-right">
                 <button className="px-4 py-2 text-sm font-semibold text-white bg-brand-blue rounded-md hover:bg-brand-blue-dark">
                    Finalize & Save Discharge Summary
                </button>
            </div>
        </div>
    );
};

// --- MAIN WORKSPACE COMPONENT ---

const PatientWorkspace: React.FC<{ patient: Patient, user: User }> = ({ patient, user }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'clinicalFile' | 'orders' | 'rounds' | 'vitals' | 'discharge'>('clinicalFile');

    const tabs = [
        { key: 'overview', name: 'Overview' },
        { key: 'clinicalFile', name: 'Clinical File' },
        { key: 'orders', name: 'Orders' },
        { key: 'rounds', name: 'Rounds' },
        { key: 'vitals', name: 'Vitals' },
        { key: 'discharge', name: 'Discharge' },
    ];

    return (
        <div className="bg-background-primary rounded-xl shadow-lg max-w-7xl mx-auto">
            {/* Header */}
            <PatientWorkspaceHeader patient={patient} />

             {/* Tabs */}
            <div className="border-b border-border-color bg-background-secondary rounded-t-lg sticky top-0 z-10">
                <nav className="-mb-px flex px-4 md:px-6 space-x-4 overflow-x-auto">
                    {tabs.map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} className={`py-3 px-1 text-md font-semibold whitespace-nowrap ${activeTab === tab.key ? 'text-brand-blue border-b-2 border-brand-blue' : 'text-text-tertiary hover:text-text-secondary'}`}>
                            {tab.name}
                        </button>
                    ))}
                </nav>
            </div>
            {/* Content */}
            <div className="bg-background-secondary">
                {activeTab === 'overview' && <OverviewTab patient={patient} />}
                {activeTab === 'clinicalFile' && <ClinicalFileTab patient={patient} user={user} />}
                {activeTab === 'orders' && <OrdersTab patient={patient} user={user} />}
                {activeTab === 'rounds' && <RoundsTab patient={patient} />}
                {activeTab === 'vitals' && <VitalsTab patient={patient} />}
                {activeTab === 'discharge' && <DischargeTab patient={patient} />}
            </div>
        </div>
    );
};


const PatientDetailPage: React.FC = () => {
    const { patients, selectedPatientId, setPage, currentUser } = useContext(AppContext) as AppContextType;
    const patient = patients.find(p => p.id === selectedPatientId);

    useEffect(() => {
        if (!patient) {
            setPage('dashboard');
        }
    }, [patient, setPage]);

    if (!patient) {
        return <div className="text-center p-10"><p>Patient not found. Redirecting...</p></div>;
    }

    return (
        <div className="max-w-7xl mx-auto">
            <button onClick={() => setPage('dashboard')} className="mb-4 text-sm text-brand-blue hover:underline">&larr; Back to Dashboard</button>
            <PatientWorkspace patient={patient} user={currentUser} />
        </div>
    );
};

export default PatientDetailPage;