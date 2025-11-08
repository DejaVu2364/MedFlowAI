





import React, { useState, useCallback, useEffect } from 'react';
import { AppContextType, Page, Patient, Vitals, VitalsRecord, ChatMessage, TeamNote, SOAPNote, Checklist, User, AuditEvent, Order, AITriageSuggestion, OrderStatus, Round, ClinicalFileSections, AISuggestionHistory, HistorySectionData, Allergy, OrderCategory, VitalsMeasurements } from './types';
import DashboardPage from './pages/DashboardPage';
import ReceptionPage from './pages/ReceptionPage';
import TriagePage from './pages/TriagePage';
import PatientDetailPage from './pages/PatientDetailPage';
import Header from './components/Header';
import ChatPanel from './components/ChatPanel';
import { classifyComplaint, suggestOrdersFromClinicalFile, compileDischargeSummary, generateOverviewSummary, summarizeClinicalFile, crossCheckRound, getFollowUpQuestions as getFollowUpQuestionsFromService, composeHistoryParagraph, summarizeVitals as summarizeVitalsFromService } from './services/geminiService';
import { calculateTriageFromVitals, seedPatients, logAuditEventToServer, MOCK_DOCTOR } from './services/api';
import { answerWithRAG } from './services/geminiService';

export const AppContext = React.createContext<AppContextType | null>(null);

const App: React.FC = () => {
    const [page, _setPage] = useState<Page>('dashboard');
    const [currentUser, setUser] = useState<User>(MOCK_DOCTOR);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [auditLog, setAuditLog] = useState<AuditEvent[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    // Wrapped setPage to clear errors on navigation
    const setPage = (newPage: Page) => {
        setError(null);
        _setPage(newPage);
    };

     useEffect(() => {
        // Apply theme to root element
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            try {
                // Load initial patients, as a user is now logged in by default.
                const initialPatients = await seedPatients();
                setPatients(initialPatients);
            } catch (e) {
                setError('Failed to load initial patient data.');
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, []);

    const addPatient = useCallback(async (patientData: Omit<Patient, 'id' | 'status' | 'registrationTime' | 'triage' | 'timeline' | 'orders' | 'vitalsHistory' | 'clinicalFile' | 'rounds' | 'dischargeSummary' | 'overview' | 'results' | 'vitals'>) => {
        setIsLoading(true);
        setError(null);

        let aiTriageWithCache: AITriageSuggestion & { fromCache: boolean };

        try {
            const result = await classifyComplaint(patientData.complaint);
            aiTriageWithCache = { ...result.data, fromCache: result.fromCache };
        } catch (e) {
            console.error("AI classification failed, but patient will be added:", e);
            aiTriageWithCache = {
                department: 'Unknown',
                suggested_triage: 'None',
                confidence: 0,
                fromCache: false
            };
            const errorString = String(e);
            if (errorString.includes("RESOURCE_EXHAUSTED") || errorString.includes("429")) {
                setError("AI Advisory unavailable due to API quota. Patient was registered without AI suggestion.");
            }
        }
        
        const patientId = `PAT-${Date.now()}`;
        const newPatient: Patient = {
            ...patientData,
            id: patientId,
            status: 'Waiting for Triage',
            registrationTime: new Date().toISOString(),
            aiTriage: aiTriageWithCache,
            triage: { level: 'None', reasons: [] },
            timeline: [],
            orders: [],
            results: [],
            vitalsHistory: [],
            clinicalFile: { 
                id: `CF-${patientId}`, 
                patientId, 
                status: 'draft',
                aiSuggestions: {},
                sections: {
                    history: { chief_complaint: patientData.complaint, associated_symptoms: [], allergy_history: [], review_of_systems: {} },
                    gpe: { flags: { pallor: false, icterus: false, cyanosis: false, clubbing: false, lymphadenopathy: false, edema: false }},
                    systemic: {}
                }
            },
            rounds: [],
        };

        setPatients(prev => [newPatient, ...prev]);
        setIsLoading(false);
        setPage('dashboard');
    }, []);

    const updatePatientVitals = useCallback(async (patientId: string, vitals: Vitals) => {
        setIsLoading(true);
        setError(null);
        try {
            // Map from simple Vitals (Triage form) to VitalsMeasurements
            const measurements: VitalsMeasurements = {
                pulse: vitals.hr,
                bp_sys: vitals.bpSys,
                bp_dia: vitals.bpDia,
                rr: vitals.rr,
                spo2: vitals.spo2,
                temp_c: vitals.temp,
            };
            
            const triage = calculateTriageFromVitals(measurements);
            
            const newVitalsRecord: VitalsRecord = {
                vitalId: `VIT-${Date.now()}`,
                patientId,
                recordedAt: new Date().toISOString(),
                recordedBy: currentUser.id,
                source: 'manual',
                measurements
            };
            
            setPatients(prev =>
                prev.map(p =>
                    p.id === patientId
                    ? { ...p, vitals: measurements, triage, status: 'Waiting for Doctor', vitalsHistory: [newVitalsRecord, ...p.vitalsHistory] }
                    : p
                )
            );
            setPage('dashboard');
            setSelectedPatientId(null);
        } catch (e) {
            setError('Failed to process vitals.');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser.id]);
    
    const addVitalsRecord = useCallback((patientId: string, entryData: Pick<VitalsRecord, 'measurements' | 'observations' | 'source'>) => {
        const newRecord: VitalsRecord = {
            ...entryData,
            vitalId: `VIT-${Date.now()}`,
            patientId: patientId,
            recordedAt: new Date().toISOString(),
            recordedBy: currentUser.id,
        };
        setPatients(prev => prev.map(p =>
            p.id === patientId ? { ...p, vitals: entryData.measurements, vitalsHistory: [newRecord, ...p.vitalsHistory] } : p
        ));
        logAuditEvent({
            userId: currentUser.id, patientId, action: 'create', entity: 'vitals',
            payload: { vitals: entryData.measurements }
        });
    }, [currentUser.id]);

    const addNoteToPatient = useCallback(async (patientId: string, content: string, isEscalation: boolean = false) => {
        const newNote: TeamNote = {
            content,
            isEscalation,
            author: currentUser.name,
            authorId: currentUser.id,
            role: currentUser.role,
            id: `NOTE-${Date.now()}`,
            type: 'TeamNote',
            patientId,
            timestamp: new Date().toISOString(),
        };
        setPatients(prev => prev.map(p => p.id === patientId ? { ...p, timeline: [newNote, ...p.timeline] } : p));
    }, [currentUser]);
    
    const updateClinicalFileSection = useCallback(<K extends keyof ClinicalFileSections>(
        patientId: string, 
        sectionKey: K, 
        data: Partial<ClinicalFileSections[K]>
    ) => {
        setPatients(prev => prev.map(p => {
            if (p.id !== patientId) return p;

            const newSections: ClinicalFileSections = {
                ...p.clinicalFile.sections,
                [sectionKey]: {
                    ...p.clinicalFile.sections[sectionKey],
                    ...data
                }
            };
            
            // Special handling for nested objects like 'flags' in GPE
            if (sectionKey === 'gpe' && 'flags' in data) {
                 (newSections.gpe as any).flags = {
                    ...p.clinicalFile.sections.gpe?.flags,
                    ...(data as any).flags
                };
            }
            if (sectionKey === 'gpe' && 'vitals' in data) {
                (newSections.gpe as any).vitals = {
                    ...p.clinicalFile.sections.gpe?.vitals,
                    ...(data as any).vitals
                }
            }

            return { 
                ...p, 
                clinicalFile: { 
                    ...p.clinicalFile, 
                    sections: newSections 
                } 
            };
        }));
    }, []);

    const updatePatientComplaint = useCallback((patientId: string, newComplaint: string) => {
        setPatients(prev =>
            prev.map(p =>
                p.id === patientId ? { ...p, complaint: newComplaint } : p
            )
        );
        logAuditEvent({
            userId: currentUser.id,
            patientId,
            action: 'modify',
            entity: 'patient_record',
            payload: { field: 'chiefComplaint', finalContent: newComplaint },
        });
    }, [currentUser]);

    const addSOAPNoteToPatient = useCallback(async (patientId: string, soapData: Omit<SOAPNote, 'id' | 'type' | 'patientId' | 'timestamp' | 'author' | 'authorId' | 'role'>, originalSuggestion: any) => {
        const newSOAP: SOAPNote = {
            ...soapData,
            id: `SOAP-${Date.now()}`,
            type: 'SOAP',
            patientId,
            author: currentUser.name,
            authorId: currentUser.id,
            role: currentUser.role,
            timestamp: new Date().toISOString(),
        };

        const finalContent = { s: newSOAP.s, o: newSOAP.o, a: newSOAP.a, p: newSOAP.p };
        const wasModified = JSON.stringify(originalSuggestion) !== JSON.stringify(finalContent);
        
        logAuditEvent({
            userId: currentUser.id,
            patientId,
            action: wasModified ? 'modify' : 'accept',
            entity: 'soap_note',
            entityId: newSOAP.id,
            payload: {
                aiModel: 'gemini-2.5-pro',
                originalSuggestion,
                finalContent,
            },
        });

        setPatients(prev => prev.map(p => p.id === patientId ? { ...p, timeline: [newSOAP, ...p.timeline] } : p));
    }, [currentUser]);

    const addChecklistToPatient = useCallback(async (patientId: string, title: string, items: string[]) => {
        const newChecklist: Checklist = {
            title,
            author: currentUser.name,
            authorId: currentUser.id,
            role: currentUser.role,
            id: `CHK-${Date.now()}`,
            type: 'Checklist',
            patientId,
            timestamp: new Date().toISOString(),
            items: items.map(itemText => ({ text: itemText, checked: false })),
        };
        setPatients(prev => prev.map(p => p.id === patientId ? { ...p, timeline: [newChecklist, ...p.timeline] } : p));
    }, [currentUser]);

     const toggleChecklistItem = useCallback((patientId: string, checklistId: string, itemIndex: number) => {
        setPatients(prev => prev.map(p => {
            if (p.id !== patientId) return p;
            const newTimeline = p.timeline.map(event => {
                if (event.type === 'Checklist' && event.id === checklistId) {
                    const newItems = [...event.items];
                    newItems[itemIndex].checked = !newItems[itemIndex].checked;
                    return { ...event, items: newItems };
                }
                return event;
            });
            return { ...p, timeline: newTimeline };
        }));
    }, []);

    const sendChatMessage = useCallback(async (message: string, patientContextId?: string | null) => {
        const userMessage: ChatMessage = { role: 'user', content: message };
        setChatHistory(prev => [...prev, userMessage, {role: 'model', content: '', isLoading: true}]);

        try {
            let context = '';
            let sources: string[] = [];
            if (patientContextId) {
                const patient = patients.find(p => p.id === patientContextId);
                if (patient) {
                    context = patient.timeline
                        .map(event => {
                           if (event.type === 'SOAP') return `[${event.timestamp}] SOAP Note by ${event.role} ${event.author}: S:${event.s}, O:${event.o}, A:${event.a}, P:${event.p}`;
                           if (event.type === 'TeamNote') return `[${event.timestamp}] Team Note by ${event.role} ${event.author}: ${event.content}`;
                           return '';
                        }).join('\n\n');
                    sources.push(`Patient ID: ${patient.id}`);
                }
            }

            const aiResponse = await answerWithRAG(message, context);
            const modelMessage: ChatMessage = { role: 'model', content: aiResponse, sources };
            setChatHistory(prev => [...prev.slice(0, -1), modelMessage]);

        } catch (e) {
            console.error(e);
            const errorMessage: ChatMessage = { role: 'model', content: "Sorry, I encountered an error." };
            setChatHistory(prev => [...prev.slice(0, -1), errorMessage]);
        }
    }, [patients]);

    const logAuditEvent = useCallback((eventData: Omit<AuditEvent, 'id' | 'timestamp'>) => {
        const newEvent: AuditEvent = {
            ...eventData,
            id: `AUDIT-${Date.now()}`,
            timestamp: new Date().toISOString(),
        };
        setAuditLog(prev => [newEvent, ...prev]);
        logAuditEventToServer(newEvent);
        console.log("AUDIT EVENT:", newEvent);
    }, []);
    
    // --- PATIENT WORKSPACE FUNCTIONS ---
    
    const signOffClinicalFile = useCallback(async (patientId: string) => {
        setIsLoading(true);
        const patient = patients.find(p => p.id === patientId);
        if (!patient) {
            setError("Patient not found for sign-off.");
            setIsLoading(false);
            return;
        }

        // 1. Update ClinicalFile status
        const updatedFile = { ...patient.clinicalFile, status: 'signed' as const, signedAt: new Date().toISOString(), signedBy: currentUser.id };
        
        // 2. Create first Round
        // This is now handled by the Rounds tab itself.
        
        // 3. Generate suggested orders
        let suggestedOrders: Order[] = [];
        try {
            const result = await suggestOrdersFromClinicalFile(patient.clinicalFile.sections);
            suggestedOrders = result.map(o => ({
                orderId: `ORD-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                patientId: patient.id,
                createdBy: currentUser.id,
                createdAt: new Date().toISOString(),
                category: o.category,
                subType: o.subType,
                label: o.label,
                payload: o.payload || {},
                priority: o.priority,
                status: 'draft',
                ai_provenance: {
                    prompt_id: null,
                    rationale: o.ai_provenance?.rationale || null,
                },
            }));
        } catch(e) {
            console.error("Failed to get AI order suggestions:", e);
            setError("AI order suggestion failed. Please add orders manually.");
        }
        
        // 4. Update patient state
        setPatients(prev => prev.map(p => p.id === patientId ? {
            ...p,
            clinicalFile: updatedFile,
            orders: [...p.orders, ...suggestedOrders]
        } : p));

        logAuditEvent({
            userId: currentUser.id, patientId, action: 'signoff', entity: 'clinical_file', entityId: updatedFile.id
        });
        
        setIsLoading(false);
    }, [patients, currentUser]);
    
    const addOrderToPatient = useCallback((patientId: string, orderData: Partial<Order>) => {
        const newOrder: Order = {
            orderId: `ORD-${Date.now()}`,
            patientId: patientId,
            createdBy: currentUser.id,
            createdAt: new Date().toISOString(),
            status: 'draft',
            priority: 'routine',
            category: 'investigation',
            subType: '',
            label: '',
            payload: {},
            ...orderData,
        };
        setPatients(prev => prev.map(p => p.id === patientId ? { ...p, orders: [newOrder, ...p.orders] } : p));
        logAuditEvent({ userId: currentUser.id, patientId, action: 'create', entity: 'order', entityId: newOrder.orderId });
    }, [currentUser]);

    const updateOrder = useCallback((patientId: string, orderId: string, updates: Partial<Order>) => {
        setPatients(prev => prev.map(p => {
            if (p.id !== patientId) return p;
            const newOrders = p.orders.map(o => o.orderId === orderId ? { 
                ...o, 
                ...updates, 
                meta: { ...o.meta, lastModified: new Date().toISOString(), modifiedBy: currentUser.id } 
            } : o);
            return { ...p, orders: newOrders };
        }));
        logAuditEvent({
            userId: currentUser.id, patientId, action: 'modify', entity: 'order', entityId: orderId,
            payload: { updates }
        });
    }, [currentUser.id]);

    const acceptAIOrders = useCallback((patientId: string, orderIds: string[]) => {
        setPatients(prev => prev.map(p => {
            if (p.id !== patientId) return p;
            const newOrders = p.orders.map(o => 
                orderIds.includes(o.orderId) && o.status === 'draft' 
                ? { ...o, status: 'sent' as const, meta: { ...o.meta, lastModified: new Date().toISOString(), modifiedBy: currentUser.id } } 
                : o
            );
            return { ...p, orders: newOrders };
        }));
        orderIds.forEach(orderId => {
            logAuditEvent({
                userId: currentUser.id, patientId, action: 'accept', entity: 'order', entityId: orderId,
                payload: { from: 'ai_suggestion' }
            });
        });
    }, [currentUser.id]);
    
    const sendAllDrafts = useCallback((patientId: string, category: OrderCategory) => {
        setPatients(prev => prev.map(p => {
            if (p.id !== patientId) return p;
            
            let acceptedOrderIds: string[] = [];

            const newOrders = p.orders.map(o => {
                if (o.category === category && o.status === 'draft') {
                    acceptedOrderIds.push(o.orderId);
                    return { 
                        ...o, 
                        status: 'sent' as const, 
                        meta: { ...o.meta, lastModified: new Date().toISOString(), modifiedBy: currentUser.id } 
                    };
                }
                return o;
            });

            acceptedOrderIds.forEach(orderId => {
                logAuditEvent({
                    userId: currentUser.id, patientId, action: 'accept', entity: 'order', entityId: orderId,
                    payload: { from: 'bulk_send_drafts' }
                });
            });
            
            return { ...p, orders: newOrders };
        }));
    }, [currentUser.id]);

    const generateDischargeSummary = useCallback(async (patientId: string) => {
        setIsLoading(true);
        const patient = patients.find(p => p.id === patientId);
        if (!patient) {
            setError("Patient not found.");
            setIsLoading(false);
            return;
        }
        try {
            const summary = await compileDischargeSummary(patient);
            setPatients(prev => prev.map(p => p.id === patientId ? {
                ...p,
                dischargeSummary: { draft: summary }
            } : p));
        } catch (e) {
            console.error("Failed to generate discharge summary:", e);
            setError("AI summary generation failed.");
        } finally {
            setIsLoading(false);
        }
    }, [patients]);
    
    const generatePatientOverview = useCallback(async (patientId: string) => {
        setIsLoading(true);
        const patient = patients.find(p => p.id === patientId);
        if (!patient) return;
        try {
            const overview = await generateOverviewSummary(patient);
            setPatients(prev => prev.map(p => p.id === patientId ? { ...p, overview } : p));
        } catch (e) {
            console.error("Failed to generate overview:", e);
        } finally {
            setIsLoading(false);
        }
    }, [patients]);
    
    // --- NEW ROUNDS FUNCTIONS ---
    const createDraftRound = useCallback(async (patientId: string): Promise<Round> => {
        const patient = patients.find(p => p.id === patientId);
        if (!patient) throw new Error("Patient not found");

        const existingDraft = patient.rounds.find(r => r.status === 'draft');
        if (existingDraft) return existingDraft;

        const newDraft: Round = {
            roundId: `RND-${patientId}-${Date.now()}`,
            patientId,
            doctorId: currentUser.id,
            createdAt: new Date().toISOString(),
            status: 'draft',
            subjective: '',
            objective: '',
            assessment: '',
            plan: { text: '', linkedOrders: [] },
            linkedResults: [],
            signedBy: null,
            signedAt: null,
        };
        
        setPatients(prev => prev.map(p => p.id === patientId ? { ...p, rounds: [newDraft, ...p.rounds] } : p));
        logAuditEvent({ userId: currentUser.id, patientId, action: 'create', entity: 'round', entityId: newDraft.roundId });
        
        return newDraft;
    }, [patients, currentUser]);

    const updateDraftRound = useCallback((patientId: string, roundId: string, updates: Partial<Round>) => {
        setPatients(prev => prev.map(p => {
            if (p.id !== patientId) return p;
            const newRounds = p.rounds.map(r => 
                r.roundId === roundId ? { ...r, ...updates } : r
            );
            return { ...p, rounds: newRounds };
        }));
    }, []);

    const signOffRound = useCallback(async (patientId: string, roundId: string) => {
        setIsLoading(true);
        const patient = patients.find(p => p.id === patientId);
        const round = patient?.rounds.find(r => r.roundId === roundId);

        if (!patient || !round) {
            setError("Round not found.");
            setIsLoading(false);
            return;
        }

        try {
            const { contradictions } = await crossCheckRound(patient, round);
            
            let proceed = true;
            if (contradictions.length > 0) {
                // This logic is now handled by the SignoffModal in the component
            }
            
            // For now, proceeding as if confirmed
            setPatients(prev => prev.map(p => {
                if (p.id !== patientId) return p;
                const newRounds = p.rounds.map(r => 
                    r.roundId === roundId ? { ...r, status: 'signed' as const, signedAt: new Date().toISOString(), signedBy: currentUser.id } : r
                );
                return { ...p, rounds: newRounds };
            }));
             logAuditEvent({ userId: currentUser.id, patientId, action: 'signoff', entity: 'round', entityId: roundId, payload: { acknowledged_contradictions: contradictions } });
            
        } catch (e) {
            console.error("Failed to cross-check round:", e);
            setError("AI cross-check failed. Please review manually before sign-off.");
        } finally {
            setIsLoading(false);
        }
    }, [patients, currentUser]);


    const summarizePatientClinicalFile = useCallback(async (patientId: string) => {
        setIsLoading(true);
        const patient = patients.find(p => p.id === patientId);
        if (!patient) return;
        try {
            const summary = await summarizeClinicalFile(patient.clinicalFile.sections);
            setPatients(prev => prev.map(p => p.id === patientId ? { ...p, clinicalFile: { ...p.clinicalFile, aiSummary: summary } } : p));
        } catch (e) {
            console.error("Failed to summarize clinical file:", e);
        } finally {
            setIsLoading(false);
        }
    }, [patients]);
    
    const summarizeVitals = useCallback(async (patientId: string): Promise<string | null> => {
        setIsLoading(true);
        const patient = patients.find(p => p.id === patientId);
        if (!patient || patient.vitalsHistory.length < 2) {
            setIsLoading(false);
            return "Not enough data for a summary.";
        };
        try {
            const { summary } = await summarizeVitalsFromService(patient.vitalsHistory);
            return summary;
        } catch (e) {
            console.error("Failed to summarize vitals:", e);
            return "AI summary generation failed.";
        } finally {
            setIsLoading(false);
        }
    }, [patients]);


    // --- CLINICAL FILE TAB AI FUNCTIONS ---
    const formatHpi = useCallback(async (patientId: string) => {
        const patient = patients.find(p => p.id === patientId);
        if (!patient) return;
        
        const hpiText = patient.clinicalFile.sections.history?.hpi?.toLowerCase() || '';

        // Mock AI parsing based on the user's test case for interactive chips
        const suggestions: Partial<AISuggestionHistory> = {};
        if (hpiText.includes("fever") && hpiText.includes("cough")) {
             suggestions.chief_complaint = "Fever, cough and body aches";
        }
        if (hpiText.includes("three days") || hpiText.includes("3 days")) {
            suggestions.duration = "3 days";
        }
        if (hpiText.includes("body aches")) {
            suggestions.associated_symptoms = ["cough", "body aches"];
        }
        if (hpiText.includes("metformin") || hpiText.includes("diabetes")) {
            suggestions.past_medical_history = "Diabetes (on Metformin)";
        }
        if (hpiText.includes("penicillin") && hpiText.includes("rash")) {
            suggestions.allergy_history = [{substance:"Penicillin", reaction:"Rash", severity:"Moderate"}];
        }
        if (hpiText.includes("father") && hpiText.includes("diabetes")) {
            suggestions.family_history = "Father: diabetes";
        }

        // Only update if we have suggestions
        if (Object.keys(suggestions).length > 0) {
            setPatients(prev => prev.map(p => 
                p.id === patientId ? {
                    ...p,
                    clinicalFile: {
                        ...p.clinicalFile,
                        aiSuggestions: {
                            ...p.clinicalFile.aiSuggestions,
                            history: suggestions
                        }
                    }
                } : p
            ));
        }
    }, [patients]);

    const acceptAISuggestion = useCallback((patientId: string, field: keyof AISuggestionHistory) => {
        setPatients(prev => prev.map(p => {
            if (p.id !== patientId) return p;

            const suggestionValue = p.clinicalFile.aiSuggestions?.history?.[field];
            if (suggestionValue === undefined) return p;

            const fieldToUpdate = field === 'structured_hpi' ? 'hpi' : field;
            let updatedData: Partial<HistorySectionData>;

            if (field === 'allergy_history') {
                const existingAllergies = p.clinicalFile.sections.history?.allergy_history || [];
                updatedData = { allergy_history: [...existingAllergies, ...(suggestionValue as Allergy[])] };
            } else {
                updatedData = { [fieldToUpdate as keyof HistorySectionData]: suggestionValue };
            }
            
            const newSuggestions = { ...p.clinicalFile.aiSuggestions?.history };
            delete newSuggestions[field];
            
            return {
                ...p,
                clinicalFile: {
                    ...p.clinicalFile,
                    sections: {
                        ...p.clinicalFile.sections,
                        history: {
                            ...p.clinicalFile.sections.history,
                            ...updatedData
                        }
                    },
                    aiSuggestions: {
                        ...p.clinicalFile.aiSuggestions,
                        history: newSuggestions
                    }
                }
            };
        }));
    }, []);

    const clearAISuggestions = useCallback((patientId: string, section: 'history') => {
        setPatients(prev => prev.map(p => {
            if (p.id !== patientId) return p;
            return {
                ...p,
                clinicalFile: {
                    ...p.clinicalFile,
                    aiSuggestions: {
                        ...p.clinicalFile.aiSuggestions,
                        [section]: undefined
                    }
                }
            };
        }));
    }, []);

    const checkMissingInfo = useCallback((patientId: string, sectionKey: keyof ClinicalFileSections) => {
        const patient = patients.find(p => p.id === patientId);
        if (!patient) return;
        
        let missing: string[] = [];
        if (sectionKey === 'history') {
             if (!patient.clinicalFile.sections.history?.allergy_history || patient.clinicalFile.sections.history.allergy_history.length === 0) {
                 missing.push("Allergies are not documented.");
             }
             if (!patient.clinicalFile.sections.history?.past_medical_history) {
                 missing.push("Past Medical History is empty.");
             }
        }
        
        setPatients(prev => prev.map(p => p.id === patientId ? {
            ...p, clinicalFile: { ...p.clinicalFile, missingInfo: missing }
        } : p));
    }, [patients]);

    const summarizeSection = useCallback(async (patientId: string, sectionKey: keyof ClinicalFileSections) => {
        await summarizePatientClinicalFile(patientId);
    }, [summarizePatientClinicalFile]);

    const crossCheckFile = useCallback(async (patientId: string) => {
        const patient = patients.find(p => p.id === patientId);
        if (!patient) return;

        let inconsistencies: string[] = [];
        const historyText = JSON.stringify(patient.clinicalFile.sections.history).toLowerCase();
        const gpeTemp = patient.clinicalFile.sections.gpe?.vitals?.temp_c;

        if (historyText.includes('fever') && gpeTemp && gpeTemp < 37.5) {
            inconsistencies.push("History mentions 'fever', but current temperature in GPE is normal. Please verify.");
        }
        
        setPatients(prev => prev.map(p => p.id === patientId ? {
            ...p, clinicalFile: { ...p.clinicalFile, crossCheckInconsistencies: inconsistencies }
        } : p));
    }, [patients]);
    
    // --- NEW AI HISTORY COMPOSITION FUNCTIONS ---
    
    const getFollowUpQuestions = useCallback(async (patientId: string, sectionKey: 'history', fieldKey: keyof HistorySectionData, seedText: string) => {
        try {
            const questions = await getFollowUpQuestionsFromService(sectionKey, seedText);
            setPatients(prev => prev.map(p => {
                if (p.id !== patientId) return p;
                const historySuggestions = p.clinicalFile.aiSuggestions?.history || {};
                const newFollowUpQuestions = { ...historySuggestions.followUpQuestions, [fieldKey]: questions };
                return {
                    ...p,
                    clinicalFile: {
                        ...p.clinicalFile,
                        aiSuggestions: {
                            ...p.clinicalFile.aiSuggestions,
                            history: { ...historySuggestions, followUpQuestions: newFollowUpQuestions, }
                        }
                    }
                };
            }));
        } catch(e) {
            console.error(e);
            setError(`Failed to get follow-up questions for ${fieldKey}.`);
        }
    }, []);

    const updateFollowUpAnswer = useCallback((patientId: string, fieldKey: keyof HistorySectionData, questionId: string, answer: string) => {
        setPatients(prev => prev.map(p => {
            if (p.id !== patientId) return p;
            const historySuggestions = p.clinicalFile.aiSuggestions?.history || {};
            const fieldAnswers = historySuggestions.followUpAnswers?.[fieldKey] || {};
            const newAnswers = { ...fieldAnswers, [questionId]: answer };
            const newFollowUpAnswers = { ...historySuggestions.followUpAnswers, [fieldKey]: newAnswers };

            return {
                ...p,
                clinicalFile: {
                    ...p.clinicalFile,
                    aiSuggestions: {
                        ...p.clinicalFile.aiSuggestions,
                        history: { ...historySuggestions, followUpAnswers: newFollowUpAnswers }
                    }
                }
            };
        }));
    }, []);

    const composeHistoryWithAI = useCallback(async (patientId: string, sectionKey: 'history', fieldKey: keyof HistorySectionData) => {
        const patient = patients.find(p => p.id === patientId);
        if (!patient) return;

        const seedText = (patient.clinicalFile.sections.history?.[fieldKey] as string) || '';
        const answers = patient.clinicalFile.aiSuggestions?.history?.followUpAnswers?.[fieldKey] || {};
        const questions = patient.clinicalFile.aiSuggestions?.history?.followUpQuestions?.[fieldKey] || [];
        const answerMapWithQuestionText = Object.entries(answers).reduce((acc, [qId, ans]) => {
            const questionText = questions.find(q => q.id === qId)?.text;
            if (questionText) acc[questionText] = ans;
            return acc;
        }, {} as Record<string, string>);

        try {
            const { paragraph } = await composeHistoryParagraph(sectionKey, seedText, answerMapWithQuestionText);

            setPatients(prev => prev.map(p => {
                if (p.id !== patientId) return p;

                const newHistorySection = { ...p.clinicalFile.sections.history, [fieldKey]: paragraph };
                
                const newFollowUpQuestions = { ...p.clinicalFile.aiSuggestions?.history?.followUpQuestions };
                delete newFollowUpQuestions[fieldKey];
                const newFollowUpAnswers = { ...p.clinicalFile.aiSuggestions?.history?.followUpAnswers };
                delete newFollowUpAnswers[fieldKey];
                const newHistorySuggestions = { ...p.clinicalFile.aiSuggestions?.history, followUpQuestions: newFollowUpQuestions, followUpAnswers: newFollowUpAnswers };

                return {
                    ...p,
                    clinicalFile: {
                        ...p.clinicalFile,
                        sections: { ...p.clinicalFile.sections, history: newHistorySection },
                        aiSuggestions: { ...p.clinicalFile.aiSuggestions, history: newHistorySuggestions }
                    }
                };
            }));
        } catch (e) {
            console.error(e);
            setError(`Failed to compose paragraph for ${fieldKey}.`);
        }
    }, [patients]);


    const renderPage = () => {
        switch (page) {
            case 'dashboard':
                return <DashboardPage />;
            case 'reception':
                return <ReceptionPage />;
            case 'triage':
                return <TriagePage />;
            case 'patientDetail':
                return <PatientDetailPage />;
            default:
                return <DashboardPage />;
        }
    };

    const appContextValue: AppContextType = {
        page,
        setPage,
        currentUser,
        setUser,
        patients,
        auditLog,
        addPatient,
        updatePatientVitals,
        addNoteToPatient,
        addSOAPNoteToPatient,
        addChecklistToPatient,
        updatePatientComplaint,
        toggleChecklistItem,
        selectedPatientId,
        setSelectedPatientId,
        isLoading,
        error,
        chatHistory,
        sendChatMessage,
        logAuditEvent,
        // Workspace functions
        signOffClinicalFile,
        updateOrder,
        acceptAIOrders,
        sendAllDrafts,
        addVitalsRecord,
        generateDischargeSummary,
        addOrderToPatient,
        generatePatientOverview,
        summarizePatientClinicalFile,
        summarizeVitals,
        // Rounds Functions
        createDraftRound,
        updateDraftRound,
        signOffRound,
        // Clinical File Tab AI Functions
        updateClinicalFileSection,
        formatHpi,
        checkMissingInfo,
        summarizeSection,
        crossCheckFile,
        acceptAISuggestion,
        clearAISuggestions,
        getFollowUpQuestions,
        updateFollowUpAnswer,
        composeHistoryWithAI,
        theme,
        toggleTheme,
    };
    
    return (
        <AppContext.Provider value={appContextValue}>
            <div className="min-h-screen bg-background-secondary font-sans">
                <Header onToggleChat={() => setIsChatOpen(!isChatOpen)} />
                <main className="p-4 sm:p-6 lg:p-8">
                    {renderPage()}
                </main>
                <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
            </div>
        </AppContext.Provider>
    );
};

export default App;