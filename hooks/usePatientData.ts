
import { useState, useEffect, useCallback } from 'react';
import { Patient, AuditEvent, User, PatientStatus, Vitals, VitalsRecord, SOAPNote, TeamNote, Checklist, Order, OrderCategory, Round, AISuggestionHistory, Allergy, VitalsMeasurements, DischargeSummary, ChiefComplaint, ClinicalFile } from '../types';
import { seedPatients, calculateTriageFromVitals, logAuditEventToServer } from '../services/api';
import { subscribeToPatients, savePatient, updatePatientInDb, logAuditToDb, getIsFirebaseInitialized } from '../services/firebase';
import { classifyComplaint, suggestOrdersFromClinicalFile, generateStructuredDischargeSummary, generateOverviewSummary, summarizeClinicalFile, summarizeVitals as summarizeVitalsFromService, crossCheckRound, getFollowUpQuestions as getFollowUpQuestionsFromService, composeHistoryParagraph, generateHandoverSummary as generateHandoverSummaryService, answerWithRAG, scanForMissingInfo, summarizeSection as summarizeSectionService, crossCheckClinicalFile, checkOrderSafety } from '../services/geminiService';
import { useToast } from '../contexts/ToastContext';

export const usePatientData = (currentUser: User | null) => {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [auditLog, setAuditLog] = useState<AuditEvent[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const { addToast } = useToast();
    console.log("DEBUG: usePatientData render, user:", currentUser?.email);

    // Initial Data Load & Sync
    useEffect(() => {
        let unsubscribe: (() => void) | undefined;
        const initialize = async () => {
            console.log("DEBUG: initialize called");
            setIsLoading(true);

            // Safety timeout to ensure loading state doesn't hang
            const safetyTimeout = setTimeout(() => {
                console.log("DEBUG: safetyTimeout triggered");
                setIsLoading(false);
            }, 5000);

            if (getIsFirebaseInitialized()) {
                // Subscribe to real-time updates
                unsubscribe = subscribeToPatients((realtimePatients) => {
                    clearTimeout(safetyTimeout);
                    if (realtimePatients.length === 0) {
                        // Auto-seed if empty to prevent "broken" feel
                        console.log("DEBUG: DB empty, seeding initial data...");
                        seedPatients().then(seeded => {
                            seeded.forEach(p => savePatient(p));
                        });
                    } else {
                        setPatients(realtimePatients);
                    }
                    setIsLoading(false);
                });
            } else {
                // Local Mode Fallback
                try {
                    const stored = localStorage.getItem('medflow_patients');
                    if (stored) {
                        console.log("DEBUG: Loading patients from localStorage");
                        setPatients(JSON.parse(stored));
                    } else {
                        console.log("DEBUG: Seeding patients...");
                        const initialPatients = await seedPatients();
                        console.log("DEBUG: Seeded patients:", initialPatients.length);
                        setPatients(initialPatients);
                        localStorage.setItem('medflow_patients', JSON.stringify(initialPatients));
                    }
                } catch (e) {
                    console.error("DEBUG: Seed failed", e);
                    setError('Failed to load initial data.');
                } finally {
                    clearTimeout(safetyTimeout);
                    console.log("DEBUG: initialize finally, setting isLoading false");
                    setIsLoading(false);
                }
            }
        };

        if (currentUser) {
            initialize();
        } else {
            setPatients([]);
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [currentUser]);

    // --- Helper to update state AND firebase ---
    const updateStateAndDb = useCallback((patientId: string, updater: (p: Patient) => Patient) => {
        console.log("DEBUG: updateStateAndDb called for", patientId);
        setPatients(prev => {
            const newPatients = prev.map(p => {
                if (p.id === patientId) {
                    const updated = updater(p);
                    // Sync to DB
                    if (getIsFirebaseInitialized()) {
                        updatePatientInDb(patientId, updated);
                    }
                    return updated;
                }
                return p;
            });

            console.log("DEBUG: Is Firebase Initialized?", getIsFirebaseInitialized());
            if (!getIsFirebaseInitialized()) {
                console.log("DEBUG: Writing to localStorage", newPatients.length);
                localStorage.setItem('medflow_patients', JSON.stringify(newPatients));
            }

            return newPatients;
        });
    }, []);


    // --- Actions ---

    const logAuditEvent = useCallback((eventData: Omit<AuditEvent, 'id' | 'timestamp'>) => {
        const newEvent: AuditEvent = {
            ...eventData,
            id: `AUDIT-${Date.now()}`,
            timestamp: new Date().toISOString(),
        };
        setAuditLog(prev => [newEvent, ...prev]);
        logAuditEventToServer(newEvent);
        logAuditToDb(newEvent);
    }, []);

    const addPatient = useCallback(async (patientData: Omit<Patient, 'id' | 'status' | 'registrationTime' | 'triage' | 'timeline' | 'orders' | 'vitalsHistory' | 'clinicalFile' | 'rounds' | 'dischargeSummary' | 'overview' | 'results' | 'vitals' | 'handoverSummary'>) => {
        console.log("DEBUG: addPatient entered");
        setIsLoading(true);
        setError(null);

        try {
            let aiTriageWithCache: any;

            try {
                // Use the first complaint for AI triage for now
                const primaryComplaint = patientData.chiefComplaints[0]?.complaint || '';
                const result = await classifyComplaint(primaryComplaint);
                aiTriageWithCache = { ...result.data, fromCache: result.fromCache };
            } catch (e) {
                console.warn("AI Triage failed, falling back to default:", e);
                aiTriageWithCache = { department: 'Unknown', suggested_triage: 'None', confidence: 0, fromCache: false };
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
                    hopi: '',
                    pmh: '',
                    dh: '',
                    sh: '',
                    allergies: '',
                    gpe: '',
                    systemic: {
                        cvs: '',
                        rs: '',
                        cns: '',
                        abdomen: ''
                    },
                    inconsistencies: [],
                    version: 1
                },
                rounds: [],
            };

            if (getIsFirebaseInitialized()) {
                await savePatient(newPatient);
            } else {
                setPatients(prev => {
                    const updated = [newPatient, ...prev];
                    localStorage.setItem('medflow_patients', JSON.stringify(updated));
                    return updated;
                });
            }
            addToast('Patient registered successfully', 'success');
        } catch (err: any) {
            console.error("Failed to add patient:", err);
            const msg = err.message || "Failed to register patient.";
            setError(msg);
            addToast(msg, 'error');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);

    const updatePatientVitals = useCallback(async (patientId: string, vitals: Vitals) => {
        if (!currentUser) return;
        setIsLoading(true);
        try {
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

            updateStateAndDb(patientId, p => ({
                ...p,
                vitals: measurements,
                triage,
                status: 'Waiting for Doctor',
                vitalsHistory: [newVitalsRecord, ...p.vitalsHistory]
            }));

        } catch (e) {
            setError('Failed to process vitals.');
        } finally {
            setIsLoading(false);
        }
    }, [currentUser, updateStateAndDb]);

    const updatePatientComplaint = useCallback((patientId: string, newComplaints: ChiefComplaint[]) => {
        if (!currentUser) return;
        updateStateAndDb(patientId, p => ({ ...p, chiefComplaints: newComplaints }));
        logAuditEvent({ userId: currentUser.id, patientId, action: 'modify', entity: 'patient_record', payload: { field: 'chiefComplaints', value: newComplaints } });
    }, [currentUser, updateStateAndDb, logAuditEvent]);

    const updatePatientStatus = useCallback((patientId: string, status: PatientStatus) => {
        if (!currentUser) return;
        updateStateAndDb(patientId, p => ({ ...p, status }));
        logAuditEvent({ userId: currentUser.id, patientId, action: 'modify', entity: 'patient_record', payload: { field: 'status', value: status } });
    }, [currentUser, updateStateAndDb, logAuditEvent]);

    const addNoteToPatient = useCallback(async (patientId: string, content: string, isEscalation: boolean = false) => {
        if (!currentUser) return;
        const newNote: TeamNote = {
            content, isEscalation, author: currentUser.name, authorId: currentUser.id, role: currentUser.role,
            id: `NOTE-${Date.now()}`, type: 'TeamNote', patientId, timestamp: new Date().toISOString(),
        };
        updateStateAndDb(patientId, p => ({ ...p, timeline: [newNote, ...p.timeline] }));
    }, [currentUser, updateStateAndDb]);

    const addSOAPNoteToPatient = useCallback(async (patientId: string, soapData: Omit<SOAPNote, 'id' | 'type' | 'patientId' | 'timestamp' | 'author' | 'authorId' | 'role'>, originalSuggestion: any) => {
        if (!currentUser) return;
        const newSOAP: SOAPNote = {
            ...soapData, id: `SOAP-${Date.now()}`, type: 'SOAP', patientId, author: currentUser.name, authorId: currentUser.id, role: currentUser.role, timestamp: new Date().toISOString(),
        };
        updateStateAndDb(patientId, p => ({ ...p, timeline: [newSOAP, ...p.timeline] }));
    }, [currentUser, updateStateAndDb]);

    const updateClinicalFileSection = useCallback((patientId: string, updates: Partial<ClinicalFile>) => {
        updateStateAndDb(patientId, p => {
            let newSystemic = p.clinicalFile.systemic;
            if (updates.systemic) {
                newSystemic = { ...newSystemic, ...updates.systemic };
            }

            return {
                ...p,
                clinicalFile: {
                    ...p.clinicalFile,
                    ...updates,
                    systemic: newSystemic
                }
            };
        });
    }, [updateStateAndDb]);

    const composeHistoryWithAI = useCallback(async (patientId: string, sectionKey: 'history', fieldKey: string) => {
        // Stubbed for new Clinical File
        console.warn("composeHistoryWithAI is deprecated in new Clinical File");
    }, []);

    const signOffClinicalFile = useCallback(async (patientId: string) => {
        // Stubbed for new Clinical File
        console.warn("signOffClinicalFile is deprecated in new Clinical File");
    }, []);

    const generateDischargeSummary = useCallback(async (patientId: string) => {
        const patient = patients.find(p => p.id === patientId);
        if (!patient || !currentUser) return;
        setIsLoading(true);
        try {
            const summaryData = await generateStructuredDischargeSummary(patient);

            const fullSummary: DischargeSummary = {
                ...summaryData,
                id: `DS-${Date.now()}`,
                patientId: patientId,
                doctorId: currentUser.id,
                status: 'draft',
                generatedAt: new Date().toISOString()
            };

            updateStateAndDb(patientId, p => ({ ...p, dischargeSummary: fullSummary }));
        } catch (e) { setError("AI summary generation failed."); }
        setIsLoading(false);
    }, [patients, updateStateAndDb, setError, currentUser]);

    const saveDischargeSummary = useCallback(async (patientId: string, summary: DischargeSummary) => {
        updateStateAndDb(patientId, p => ({ ...p, dischargeSummary: summary }));
    }, [updateStateAndDb]);

    const finalizeDischarge = useCallback(async (patientId: string, summary: DischargeSummary) => {
        if (!currentUser) return;

        const finalizedSummary: DischargeSummary = {
            ...summary,
            status: 'finalized',
            finalizedAt: new Date().toISOString()
        };

        // Update Patient State
        updateStateAndDb(patientId, p => ({
            ...p,
            status: 'Discharged',
            dischargeSummary: finalizedSummary
        }));

        // Log Housekeeping Task (Simulation)
        logAuditEvent({
            userId: currentUser.id,
            patientId: patientId,
            action: 'create',
            entity: 'housekeeping_task',
            payload: { task: 'Terminal Clean', bedId: 'Unassigned', priority: 'High' }
        });

        // Log finalization
        logAuditEvent({
            userId: currentUser.id,
            patientId: patientId,
            action: 'finalize',
            entity: 'discharge_summary',
            entityId: summary.id
        });

    }, [currentUser, updateStateAndDb, logAuditEvent]);

    const generatePatientOverview = useCallback(async (patientId: string) => {
        const patient = patients.find(p => p.id === patientId);
        if (!patient) return;
        try {
            const overview = await generateOverviewSummary(patient);
            updateStateAndDb(patientId, p => ({ ...p, overview }));
        } catch (e) { console.error(e); }
    }, [patients, updateStateAndDb]);

    const generateHandoverSummary = useCallback(async (patientId: string) => {
        const patient = patients.find(p => p.id === patientId);
        if (!patient) return;
        setIsLoading(true);
        try {
            const summary = await generateHandoverSummaryService(patient);
            updateStateAndDb(patientId, p => ({ ...p, handoverSummary: summary }));
        } catch (e) { setError("Handover generation failed"); }
        setIsLoading(false);
    }, [patients, updateStateAndDb]);

    const summarizePatientClinicalFile = useCallback(async (patientId: string) => {
        // Stubbed
        console.warn("summarizePatientClinicalFile is deprecated in new Clinical File");
    }, []);

    const formatHpi = useCallback(async (patientId: string) => {
        // Stubbed
        console.warn("formatHpi is deprecated in new Clinical File");
    }, []);

    const checkMissingInfo = useCallback(async (patientId: string, section: string) => {
        // Stubbed
        console.warn("checkMissingInfo is deprecated in new Clinical File");
    }, []);

    const summarizeSection = useCallback(async (patientId: string, section: string) => {
        // Stubbed
        console.warn("summarizeSection is deprecated in new Clinical File");
    }, []);

    const getFollowUpQuestions = useCallback(async (patientId: string, section: string, fieldKey: string, context: string) => {
        // Stubbed
        console.warn("getFollowUpQuestions is deprecated in new Clinical File");
    }, []);

    const updateFollowUpAnswer = useCallback((patientId: string, section: string, questionId: string, answer: string) => {
        // Stubbed
    }, []);

    const updateFollowUpAnswerCorrect = useCallback((patientId: string, fieldKey: string, questionId: string, answer: string) => {
        // Stubbed
    }, []);

    const crossCheckFile = useCallback(async (patientId: string) => {
        // Stubbed
        console.warn("crossCheckFile is deprecated in new Clinical File");
    }, []);

    // --- ORDER MANAGEMENT (Fixed) ---

    const addOrderToPatient = useCallback(async (patientId: string, orderData: Omit<Order, 'orderId' | 'patientId' | 'createdBy' | 'createdAt' | 'status' | 'ai_provenance'>) => {
        if (!currentUser) return;
        const patient = patients.find(p => p.id === patientId);
        if (!patient) return;

        const newOrder: Order = {
            ...orderData,
            orderId: `ORD-${Date.now()}`,
            patientId,
            createdBy: currentUser.id,
            createdAt: new Date().toISOString(),
            status: 'draft',
            ai_provenance: { prompt_id: null, rationale: null }
        };

        // Safety Check
        if (orderData.category === 'medication') {
            const safetyCheck = await checkOrderSafety(newOrder, patient);
            if (!safetyCheck.safe) {
                addToast(`Safety Warning: ${safetyCheck.warning}`, 'error');
                // We still add it as draft, but maybe mark it? For now just warn.
            }
        }

        updateStateAndDb(patientId, p => ({ ...p, orders: [newOrder, ...p.orders] }));
        addToast("Order added to drafts", 'success');
    }, [currentUser, patients, updateStateAndDb, addToast]);

    const updateOrder = useCallback((patientId: string, orderId: string, updates: Partial<Order>) => {
        updateStateAndDb(patientId, p => ({
            ...p,
            orders: p.orders.map(o => o.orderId === orderId ? { ...o, ...updates } : o)
        }));
    }, [updateStateAndDb]);

    const sendAllDrafts = useCallback((patientId: string, category?: OrderCategory) => {
        updateStateAndDb(patientId, p => {
            const newOrders = p.orders.map(o => {
                if (o.status === 'draft' && (!category || o.category === category)) {
                    return { ...o, status: 'sent' as const };
                }
                return o;
            });
            return { ...p, orders: newOrders };
        });
        addToast("Orders sent successfully", 'success');
    }, [updateStateAndDb, addToast]);

    const createDraftRound = useCallback(async (patientId: string) => {
        if (!currentUser) throw new Error("No user");
        const newRound: Round = {
            roundId: `RND-${Date.now()}`,
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
            signedAt: null
        };
        updateStateAndDb(patientId, p => ({ ...p, rounds: [newRound, ...p.rounds] }));
        return newRound;
    }, [currentUser, updateStateAndDb]);

    const updateDraftRound = useCallback((patientId: string, roundId: string, updates: Partial<Round>) => {
        updateStateAndDb(patientId, p => ({
            ...p,
            rounds: p.rounds.map(r => r.roundId === roundId ? { ...r, ...updates } : r)
        }));
    }, [updateStateAndDb]);

    const signOffRound = useCallback(async (patientId: string, roundId: string, acknowledgedContradictions: string[]) => {
        if (!currentUser) return;
        updateStateAndDb(patientId, p => ({
            ...p,
            rounds: p.rounds.map(r => r.roundId === roundId ? {
                ...r,
                status: 'signed',
                signedBy: currentUser.id,
                signedAt: new Date().toISOString()
            } : r)
        }));
        addToast("Round signed off successfully", 'success');
    }, [currentUser, updateStateAndDb, addToast]);

    const getRoundContradictions = useCallback(async (patientId: string, roundId: string) => {
        // Placeholder for AI contradiction check
        return [];
    }, []);

    return {
        patients, auditLog, isLoading, error, setError,
        setPatients,
        addPatient, updatePatientVitals, updatePatientStatus, updatePatientComplaint, addNoteToPatient, addSOAPNoteToPatient,
        updateClinicalFileSection, composeHistoryWithAI, signOffClinicalFile, logAuditEvent,
        updateStateAndDb, generateDischargeSummary, saveDischargeSummary, finalizeDischarge, generatePatientOverview, generateHandoverSummary,
        summarizePatientClinicalFile, formatHpi, checkMissingInfo, summarizeSection, getFollowUpQuestions, updateFollowUpAnswer: updateFollowUpAnswerCorrect, crossCheckFile,
        addOrderToPatient, updateOrder, sendAllDrafts,
        createDraftRound, updateDraftRound, signOffRound, getRoundContradictions
    };
};