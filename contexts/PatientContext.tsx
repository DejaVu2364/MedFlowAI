import React, { createContext, useContext, ReactNode, useState, useMemo } from 'react';
import { usePatientData } from '../hooks/usePatientData';
import { useAuth } from './AuthContext';
import { Patient, AuditEvent, Vitals, PatientStatus, SOAPNote, ClinicalFileSections, Order, OrderCategory, DischargeSummary, Round, HistorySectionData, AISuggestionHistory, ChatMessage, Checklist, ChiefComplaint } from '../types';
import { isTestMode } from '../lib/utils';

// Define the shape of the context based on what usePatientData returns
type UsePatientDataReturn = ReturnType<typeof usePatientData>;

interface PatientContextType extends UsePatientDataReturn {
    selectedPatientId: string | null;
    setSelectedPatientId: (id: string | null) => void;
    chatHistory: ChatMessage[];
    sendChatMessage: (message: string, patientContextId?: string | null) => Promise<void>;
    addChecklistToPatient: (patientId: string, title: string, items: string[]) => Promise<void>;
    toggleChecklistItem: (patientId: string, checklistId: string, itemIndex: number) => void;
    generateClinicalFileFromVoice: (patientId: string, transcript: string) => Promise<void>;
    updatePatientComplaint: (patientId: string, newComplaints: ChiefComplaint[]) => void;
}

const PatientContext = createContext<PatientContextType | null>(null);

export const usePatient = () => {
    const context = useContext(PatientContext);
    if (!context) {
        throw new Error('usePatient must be used within a PatientProvider');
    }
    return context;
};

// Mock Patients for Test Mode
const MOCK_PATIENTS: any[] = [
    {
        id: "TEST-1",
        name: "Test Patient A (Stable)",
        age: 30,
        gender: "Male",
        triage: { level: "Green" },
        status: "Waiting for Doctor",
        clinicalFile: { hopi: "Stable patient.", pmh: "", systemic: { cvs: "", rs: "", cns: "", abdomen: "" }, inconsistencies: [], version: 1 },
        orders: [],
        investigationOrders: [],
        investigationReports: [],
        rounds: [],
        timeline: [],
        results: [],
        vitals: { pulse: 72, bp_sys: 120, bp_dia: 80, spo2: 99, temp_c: 37 }
    },
    {
        id: "TEST-2",
        name: "Test Patient B (Warning)",
        age: 45,
        gender: "Female",
        triage: { level: "Yellow" },
        status: "In Treatment",
        clinicalFile: { hopi: "Moderate pain.", pmh: "", systemic: { cvs: "", rs: "", cns: "", abdomen: "" }, inconsistencies: [], version: 1 },
        orders: [],
        investigationOrders: [],
        investigationReports: [],
        rounds: [],
        timeline: [],
        results: [],
        vitals: { pulse: 90, bp_sys: 140, bp_dia: 90, spo2: 95, temp_c: 38 }
    },
    {
        id: "TEST-3",
        name: "Test Patient C (Critical)",
        age: 60,
        gender: "Male",
        triage: { level: "Red" },
        status: "In Treatment",
        clinicalFile: { hopi: "Severe distress.", pmh: "", systemic: { cvs: "", rs: "", cns: "", abdomen: "" }, inconsistencies: [], version: 1 },
        orders: [],
        investigationOrders: [],
        investigationReports: [],
        rounds: [],
        timeline: [],
        results: [],
        vitals: { pulse: 120, bp_sys: 90, bp_dia: 60, spo2: 88, temp_c: 39 }
    }
];

export const PatientProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();
    const patientData = usePatientData(currentUser);

    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

    // Override patients if in test mode
    const finalPatientData = useMemo(() => {
        if (isTestMode) {
            return {
                ...patientData,
                patients: MOCK_PATIENTS,
                isLoading: false,
                error: null,
                // Mock mutation methods to avoid errors
                updateStateAndDb: (pid: string, updater: any) => {
                     console.log("Test Mode: updateStateAndDb called for", pid);
                },
                addPatient: async () => {},
                updatePatientVitals: async () => {},
                updateClinicalFileSection: () => {},
                // ... add other mocks as needed or rely on partial impl
            };
        }
        return patientData;
    }, [patientData]);

    const addChecklistToPatient = async (patientId: string, title: string, items: string[]) => {
        if (!currentUser || isTestMode) return;
        const newChecklist: Checklist = {
            title, author: currentUser.name, authorId: currentUser.id, role: currentUser.role,
            id: `CHK-${Date.now()}`, type: 'Checklist', patientId, timestamp: new Date().toISOString(),
            items: items.map(itemText => ({ text: itemText, checked: false })),
        };
        finalPatientData.updateStateAndDb(patientId, (p: any) => ({ ...p, timeline: [newChecklist, ...p.timeline] }));
    };

    const toggleChecklistItem = (patientId: string, checklistId: string, itemIndex: number) => {
        if (isTestMode) return;
         finalPatientData.updateStateAndDb(patientId, (p: any) => {
            const newTimeline = p.timeline.map((event: any) => {
                if (event.type === 'Checklist' && event.id === checklistId) {
                    const newItems = [...event.items];
                    newItems[itemIndex].checked = !newItems[itemIndex].checked;
                    return { ...event, items: newItems };
                }
                return event;
            });
            return { ...p, timeline: newTimeline };
        });
    };

    const sendChatMessage = async (message: string, patientContextId?: string | null) => {
        if (isTestMode) {
             setChatHistory(prev => [...prev, { role: 'user', content: message }, { role: 'model', content: "AI disabled in Test Mode.", isLoading: false }]);
             return;
        }

        const newUserMsg: ChatMessage = { role: 'user', content: message };
        setChatHistory(prev => [...prev, newUserMsg]);

        const loadingMsg: ChatMessage = { role: 'model', content: '', isLoading: true };
        setChatHistory(prev => [...prev, loadingMsg]);

        try {
            let context = "General medical knowledge query.";

            if (patientContextId) {
                const patient = finalPatientData.patients.find(p => p.id === patientContextId);
                if (patient) {
                    context = `Patient Context (Mock)`; // simplified
                }
            }

            const { answerWithRAG } = await import('../services/geminiService');
            const aiResponse = await answerWithRAG(message, context);

            setChatHistory(prev => prev.slice(0, -1).concat({
                role: 'model',
                content: aiResponse,
                isLoading: false
            }));
        } catch (error) {
            console.error('Chat AI error:', error);
            setChatHistory(prev => prev.slice(0, -1).concat({
                role: 'model',
                content: "I'm sorry, I encountered an error processing your request. Please try again.",
                isLoading: false
            }));
        }
    };

    const generateClinicalFileFromVoice = async (patientId: string, transcript: string) => {
        if (isTestMode) return;
        try {
            const { generateClinicalFileFromTranscript } = await import('../services/geminiService');
            const sections = await generateClinicalFileFromTranscript(transcript);

             finalPatientData.updateStateAndDb(patientId, (p: any) => {
                 // Mock logic match
                return p;
            });
        } catch (error) {
            console.error("Error generating clinical file from voice:", error);
            throw error;
        }
    };

    return (
        <PatientContext.Provider value={{
            ...finalPatientData,
            selectedPatientId,
            setSelectedPatientId,
            chatHistory,
            sendChatMessage,
            addChecklistToPatient,
            toggleChecklistItem,
            generateClinicalFileFromVoice
        }}>
            {children}
        </PatientContext.Provider>
    );
};
