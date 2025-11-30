import React, { useState } from 'react';
import { AIInsightBubble } from '../medview/AIInsightBubble';
import { SparklesIcon, ClipboardDocumentCheckIcon, PlusIcon, MicrophoneIcon, StopIcon } from '@heroicons/react/24/outline';
import { usePatient } from '../../contexts/PatientContext';
import { Patient } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { cn } from '../../lib/utils';

const Label = React.forwardRef<
    HTMLLabelElement,
    React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
    <label
        ref={ref}
        className={cn(
            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            className
        )}
        {...props}
    />
));
Label.displayName = "Label";

interface RoundsRedesignedProps {
    patient: Patient;
}

export const RoundsRedesigned: React.FC<RoundsRedesignedProps> = ({ patient }) => {
    const { isLoading, createDraftRound, updateDraftRound, signOffRound } = usePatient();
    const [checklist, setChecklist] = useState([
        { id: '1', text: 'Review overnight vitals trend', completed: false },
        { id: '2', text: 'Check blood culture results', completed: false },
        { id: '3', text: 'Assess fluid balance', completed: false },
        { id: '4', text: 'Plan for discharge (if stable)', completed: false },
    ]);
    const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

    // Find active draft round or use local state
    const draftRound = patient.rounds.find(r => r.status === 'draft');

    // SOAP Note State - sync with draft round if available
    const [soap, setSoap] = useState({
        subjective: draftRound?.subjective || '',
        objective: draftRound?.objective || '',
        assessment: draftRound?.assessment || '',
        plan: draftRound?.plan?.text || ''
    });
    const [isRecording, setIsRecording] = useState(false);

    // Create draft if none exists on mount (optional, or wait for user action)
    // For now, we'll create it when they try to save or we can just let them type and create on save?
    // Better to have a draft ID to update.

    const handleCreateDraft = async () => {
        if (!draftRound) {
            await createDraftRound(patient.id);
        }
    };

    const toggleCheck = (id: string) => {
        setChecklist(checklist.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
    };

    const generateSuggestions = () => {
        setIsGenerating(true);
        setTimeout(() => {
            setAiSuggestions([
                "Consider repeating CRP to monitor infection response.",
                "Review antibiotic stewardship - day 3 of Ceftriaxone.",
                "Patient reported nausea - check anti-emetic effectiveness."
            ]);
            setIsGenerating(false);
        }, 1500);
    };

    const handleScribeToggle = () => {
        if (isRecording) {
            setIsRecording(false);
            // Simulate AI Scribe Output
            const newSoap = {
                ...soap,
                subjective: "Patient reports feeling better today. Slept well overnight. No chest pain or shortness of breath. Mild nausea after breakfast.",
                assessment: "Improving clinical picture. Hemodynamically stable. Sepsis resolving.",
                plan: "1. Continue IV Antibiotics\n2. Switch to oral diet as tolerated\n3. Monitor vitals q4h"
            };
            setSoap(newSoap);
            // If we have a draft, update it
            if (draftRound) {
                updateDraftRound(patient.id, draftRound.roundId, {
                    subjective: newSoap.subjective,
                    assessment: newSoap.assessment,
                    plan: { text: newSoap.plan, linkedOrders: [] }
                });
            }
        } else {
            setIsRecording(true);
        }
    };

    const handleSoapChange = async (field: keyof typeof soap, value: string) => {
        setSoap(prev => ({ ...prev, [field]: value }));

        let currentRoundId = draftRound?.roundId;
        if (!currentRoundId) {
            // If no draft, create one (debounced in real app, but here we might need to await)
            // This is tricky inside a change handler. 
            // Better strategy: Create draft on first focus or change if null.
            // For simplicity, we'll assume the user clicks "Start Round" or we create one silently.
            // Let's just create one if missing.
            const newRound = await createDraftRound(patient.id);
            currentRoundId = newRound.roundId;
        }

        if (currentRoundId) {
            const updates: any = {};
            if (field === 'plan') {
                updates.plan = { text: value, linkedOrders: [] };
            } else {
                updates[field] = value;
            }
            updateDraftRound(patient.id, currentRoundId, updates);
        }
    };

    const handleSignNote = async () => {
        if (!draftRound) return;
        if (window.confirm("Sign off this round? This will finalize the note.")) {
            await signOffRound(patient.id, draftRound.roundId, []);
        }
    };

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
                <div className="space-y-6">
                    <div className="h-[500px] bg-muted/20 animate-pulse rounded-xl border border-border/50" />
                </div>
                <div className="space-y-6">
                    <div className="h-48 bg-muted/20 animate-pulse rounded-xl border border-border/50" />
                    <div className="h-64 bg-muted/20 animate-pulse rounded-xl border border-border/50" />
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
            {/* Left Column: SOAP Note & Scribe */}
            <div className="space-y-6">
                <Card className="border-primary/20 shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 bg-muted/30">
                        <div className="flex items-center gap-2">
                            <ClipboardDocumentCheckIcon className="w-5 h-5 text-primary" />
                            <CardTitle className="text-lg font-semibold">Daily Progress Note (SOAP)</CardTitle>
                            {(soap.subjective || soap.assessment) && (
                                <Badge variant="outline" className="text-[10px] ml-2 border-indigo-200 text-indigo-600 bg-indigo-50">
                                    {draftRound ? 'Draft Saved' : 'Unsaved'}
                                </Badge>
                            )}
                        </div>
                        <Button
                            variant={isRecording ? "destructive" : "outline"}
                            size="sm"
                            onClick={handleScribeToggle}
                            className={cn("transition-all duration-300", isRecording && "animate-pulse")}
                        >
                            {isRecording ? (
                                <>
                                    <StopIcon className="w-4 h-4 mr-2" /> Stop Recording
                                </>
                            ) : (
                                <>
                                    <MicrophoneIcon className="w-4 h-4 mr-2" /> Ambient Scribe
                                </>
                            )}
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Subjective</Label>
                            <Textarea
                                placeholder="Patient's complaints..."
                                value={soap.subjective}
                                onChange={(e) => handleSoapChange('subjective', e.target.value)}
                                className="min-h-[80px] bg-background/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Assessment</Label>
                            <Textarea
                                placeholder="Diagnosis, differential, status..."
                                value={soap.assessment}
                                onChange={(e) => handleSoapChange('assessment', e.target.value)}
                                className="min-h-[80px] bg-background/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Plan</Label>
                            <Textarea
                                placeholder="Treatment plan, orders, follow-up..."
                                value={soap.plan}
                                onChange={(e) => handleSoapChange('plan', e.target.value)}
                                className="min-h-[80px] bg-background/50"
                            />
                        </div>
                        <div className="flex justify-end pt-2">
                            <Button onClick={handleSignNote} disabled={!draftRound}>Sign & Save Note</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Right Column: Assistant & Checklist */}
            <div className="space-y-6">
                {/* Rounds Assistant */}
                <Card className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/30 dark:to-background border-purple-100 dark:border-purple-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="flex items-center gap-2">
                            <SparklesIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            <CardTitle className="text-lg font-semibold text-purple-900 dark:text-purple-300">Rounds Assistant</CardTitle>
                        </div>
                        <AIInsightBubble type="insight" onClick={generateSuggestions} label={isGenerating ? "Thinking..." : "Suggest Topics"} />
                    </CardHeader>
                    <CardContent>
                        {aiSuggestions.length > 0 ? (
                            <ul className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-500">
                                {aiSuggestions.map((suggestion, i) => (
                                    <li key={i} className="flex gap-2 text-sm text-purple-900/80 dark:text-purple-200 leading-relaxed bg-white/50 dark:bg-purple-900/20 p-2 rounded-lg border border-purple-100 dark:border-purple-800/50">
                                        <SparklesIcon className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                                        <span>{suggestion}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground italic">
                                <p>Ask AI to analyze the patient's file and suggest key topics for today's ward rounds.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Patient Checklist */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="flex items-center gap-2">
                            <ClipboardDocumentCheckIcon className="w-5 h-5 text-muted-foreground" />
                            <CardTitle className="text-lg font-semibold">Daily Checklist</CardTitle>
                        </div>
                        <Badge variant="secondary">{checklist.filter(c => c.completed).length}/{checklist.length} Done</Badge>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {checklist.map((item) => (
                            <div key={item.id} className="flex items-start space-x-3 p-2 rounded hover:bg-muted/50 transition-colors group">
                                <Checkbox
                                    id={`round-${item.id}`}
                                    checked={item.completed}
                                    onCheckedChange={() => toggleCheck(item.id)}
                                    className="mt-1"
                                />
                                <label
                                    htmlFor={`round-${item.id}`}
                                    className={cn(
                                        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1 py-1",
                                        item.completed && "line-through text-muted-foreground"
                                    )}
                                >
                                    {item.text}
                                </label>
                            </div>
                        ))}
                        <Button variant="ghost" size="sm" className="w-full mt-2 text-muted-foreground hover:text-foreground border border-dashed border-border">
                            <PlusIcon className="w-4 h-4 mr-2" /> Add Item
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
