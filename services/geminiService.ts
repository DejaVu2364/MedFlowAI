

import { GoogleGenAI, Type } from "@google/genai";
import { AITriageSuggestion, Department, TriageLevel, SOAPNote, TeamNote, FollowUpQuestion, ComposedHistory, Patient, Order, OrderCategory, PatientOverview, Vitals, ClinicalFileSections, OrderPriority } from '../types';
import { getFromCache, setInCache } from './caching';


const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const flashModel = "gemini-2.5-flash";
const proModel = "gemini-2.5-pro";

const departmentValues: Department[] = ['Cardiology', 'Orthopedics', 'General Medicine', 'Obstetrics', 'Neurology', 'Emergency', 'Unknown'];
const triageLevelValues: TriageLevel[] = ['Red', 'Yellow', 'Green'];


export const classifyComplaint = async (complaint: string): Promise<{data: AITriageSuggestion, fromCache: boolean}> => {
    const cacheKey = `classify:${complaint.toLowerCase().trim()}`;
    const cached = getFromCache<AITriageSuggestion>(cacheKey);
    if (cached) {
        return { data: cached, fromCache: true };
    }

    try {
        const response = await ai.models.generateContent({
            model: flashModel,
            contents: `You are a medical expert system. Based on the patient's chief complaint, classify it into the most likely medical department and suggest a triage level (Red, Yellow, or Green). Provide a confidence score from 0 to 1. Complaint: "${complaint}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        department: {
                            type: Type.STRING,
                            description: 'The suggested medical department.',
                            enum: departmentValues
                        },
                        suggested_triage: {
                            type: Type.STRING,
                            description: 'The suggested triage level (Red, Yellow, or Green).',
                            enum: triageLevelValues,
                        },
                        confidence: {
                            type: Type.NUMBER,
                            description: 'A confidence score between 0 and 1.',
                        },
                    },
                    required: ['department', 'suggested_triage', 'confidence'],
                },
            },
        });
        
        const jsonString = response.text;
        const result: AITriageSuggestion = JSON.parse(jsonString);
        
        setInCache(cacheKey, result);
        return { data: result, fromCache: false };

    } catch (error) {
        console.error("Error classifying complaint with Gemini:", error);
        // Rethrow the error to be handled by the UI component, which can provide better user feedback.
        throw error;
    }
};

type SOAPNoteData = Omit<SOAPNote, 'id' | 'patientId' | 'author' | 'authorId' | 'role' | 'timestamp' | 'type'>;

export const generateSOAPFromTranscript = async (transcript: string): Promise<{ data: SOAPNoteData, fromCache: boolean }> => {
    const cacheKey = `soap:${transcript.slice(0, 100)}`; // Cache based on start of transcript
    const cached = getFromCache<SOAPNoteData>(cacheKey);
    if (cached) {
        return { data: cached, fromCache: true };
    }

    try {
         const response = await ai.models.generateContent({
            model: proModel, // Use Pro for more complex reasoning
            contents: `You are a medical scribe AI. Convert the following doctor's round transcript into a structured SOAP note. Ensure each section is concise and clinically relevant. Transcript: "${transcript}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        transcript: { type: Type.STRING, description: "The original transcript provided." },
                        s: { type: Type.STRING, description: "Subjective: The patient's reported symptoms and feelings." },
                        o: { type: Type.STRING, description: "Objective: The doctor's objective findings, vitals, and exam results mentioned." },
                        a: { type: Type.STRING, description: "Assessment: The primary diagnosis or differential diagnoses." },
                        p: { type: Type.STRING, description: "Plan: The treatment plan, including tests, medications, and follow-up." },
                    },
                    required: ['s', 'o', 'a', 'p', 'transcript'],
                },
            },
        });
        const jsonString = response.text;
        const result = JSON.parse(jsonString);
        setInCache(cacheKey, result);
        return { data: result, fromCache: false };
    } catch (error) {
        console.error("Error generating SOAP note:", error);
        const fallbackResult = {
            transcript,
            s: 'Could not generate from transcript.',
            o: 'Could not generate from transcript.',
            a: 'Could not generate from transcript.',
            p: 'Could not generate from transcript.',
        };
        return { data: fallbackResult, fromCache: false };
    }
};

type SummaryData = { summary: string, escalations: string[] };

export const summarizeInternNotes = async (notes: TeamNote[]): Promise<{ data: SummaryData, fromCache: boolean }> => {
    const noteTexts = notes.map(n => n.content).join('|');
    const cacheKey = `summary:${noteTexts.slice(0, 100)}`;
    const cached = getFromCache<SummaryData>(cacheKey);
    if (cached) {
        return { data: cached, fromCache: true };
    }

     try {
        const response = await ai.models.generateContent({
            model: proModel,
            contents: `As a senior attending physician, review the following progress notes from interns. Provide a brief summary of the patient's status and create a list of key points or concerns that may require escalation or your direct attention. Notes:\n${noteTexts}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING, description: "A brief summary of the patient's overall status." },
                        escalations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of critical points needing attention." },
                    },
                    required: ['summary', 'escalations']
                }
            }
        });

        const jsonString = response.text;
        const result = JSON.parse(jsonString);
        setInCache(cacheKey, result);
        return { data: result, fromCache: false };
    } catch (error) {
        console.error("Error summarizing notes:", error);
        const fallbackResult = { summary: 'Failed to generate summary.', escalations: ['API error.'] };
        return { data: fallbackResult, fromCache: false };
    }
};

export const generateChecklist = async (diagnosis: string): Promise<{ data: string[], fromCache: boolean }> => {
    const cacheKey = `checklist:${diagnosis.toLowerCase().trim()}`;
    const cached = getFromCache<string[]>(cacheKey);
    if (cached) {
        return { data: cached, fromCache: true };
    }
    try {
        const response = await ai.models.generateContent({
            model: flashModel,
            contents: `Create a standard clinical care checklist for a patient with the following assessment: "${diagnosis}". The checklist should include 5-7 key actions or monitoring points.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                       checklist: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of checklist items." }
                    },
                    required: ['checklist']
                }
            }
        });
        const jsonString = response.text;
        const result = JSON.parse(jsonString);
        const checklistItems = result.checklist || [];
        setInCache(cacheKey, checklistItems);
        return { data: checklistItems, fromCache: false };
    } catch (error) {
        console.error("Error generating checklist:", error);
        const fallbackResult = ['Failed to generate checklist due to API error.'];
        return { data: fallbackResult, fromCache: false };
    }
};

export const answerWithRAG = async (query: string, context: string): Promise<string> => {
    try {
        const systemInstruction = `You are a helpful medical AI assistant. Answer the user's query based ONLY on the provided context. If the answer is not in the context, state that clearly. Do not use external knowledge. Context:\n${context || "No patient context provided."}`;
        
        const response = await ai.models.generateContent({
            model: proModel,
            contents: query,
            config: {
              systemInstruction,
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error with RAG answer:", error);
        return "Sorry, I couldn't process that request.";
    }
};


// --- PATIENT WORKSPACE AI HELPERS ---

export const generateOverviewSummary = async (patient: Patient): Promise<PatientOverview> => {
    const context = `
        Generate a concise overview for a clinician.
        Patient: ${patient.name}, ${patient.age}, ${patient.gender}.
        Chief Complaint: ${patient.complaint}.
        Current Vitals: ${patient.vitals ? `HR: ${patient.vitals.hr}, BP: ${patient.vitals.bpSys}/${patient.vitals.bpDia}, SpO2: ${patient.vitals.spo2}%` : 'Not recorded'}.
        Active Orders: ${patient.orders.filter(o => o.status === 'sent' || o.status === 'in_progress').map(o => o.label).join(', ') || 'None'}.
        Latest Round Summary: ${patient.rounds[0]?.summaryText || 'No rounds yet'}.
    `;
    try {
        const response = await ai.models.generateContent({
            model: proModel,
            contents: `You are a clinical AI assistant. Based on the following data, generate a structured summary for the patient's overview tab. Each field should be a very brief, single line. \n\n${context}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING, description: "A one-line summary of the patient's current situation." },
                        vitalsSnapshot: { type: Type.STRING, description: "A brief summary of the current vitals (e.g., 'Stable', 'Febrile', 'Tachycardic')." },
                        activeOrders: { type: Type.STRING, description: "A count or brief list of active orders." },
                        recentResults: { type: Type.STRING, description: "Mention any significant recent results, or 'Pending'." },
                    },
                    required: ['summary', 'vitalsSnapshot', 'activeOrders', 'recentResults'],
                },
            },
        });
        return JSON.parse(response.text) as PatientOverview;
    } catch (error) {
        console.error("Error generating overview summary:", error);
        throw error;
    }
};

export const summarizeClinicalFile = async (sections: ClinicalFileSections): Promise<string> => {
    const context = `
        History: ${JSON.stringify(sections.history)}
        GPE: ${JSON.stringify(sections.gpe)}
        Systemic Exams: ${JSON.stringify(sections.systemic)}
    `;
    try {
        const response = await ai.models.generateContent({
            model: proModel,
            contents: `Summarize the following clinical findings into a concise 3-4 line paragraph for a medical record.\n\n${context}`,
        });
        return response.text;
    } catch (error) {
        console.error("Error summarizing clinical file:", error);
        throw error;
    }
};

type SuggestedOrder = Omit<Order, 'orderId' | 'patientId' | 'createdBy' | 'createdAt' | 'status'>;

export const suggestOrdersFromClinicalFile = async (sections: ClinicalFileSections): Promise<SuggestedOrder[]> => {
    const historyText = JSON.stringify(sections.history);
    const gpeText = JSON.stringify(sections.gpe);
    const examsText = JSON.stringify(sections.systemic);
    
    const OrderCategoryEnum: OrderCategory[] = ["investigation", "radiology", "medication", "procedure", "nursing", "referral"];
    const OrderPriorityEnum: OrderPriority[] = ["routine", "urgent", "STAT"];

    try {
        const response = await ai.models.generateContent({
            model: proModel,
            contents: `You are a clinical decision support AI. Given the patient's history and examination findings, suggest relevant initial orders. Format the output as a JSON array of order objects. Include a clinical rationale for each suggestion.
            History: "${historyText}"
            GPE: "${gpeText}"
            Exams: "${examsText}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        suggested_orders: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    category: { type: Type.STRING, enum: OrderCategoryEnum },
                                    subType: { type: Type.STRING, description: "e.g., CBC, Chest X-ray, Paracetamol" },
                                    label: { type: Type.STRING, description: "Human-readable label for the order." },
                                    priority: { type: Type.STRING, enum: OrderPriorityEnum },
                                    rationale: { type: Type.STRING, description: "Clinical rationale for suggesting this order." },
                                    payload: {
                                        type: Type.OBJECT,
                                        description: "Category-specific details for the order.",
                                        properties: {
                                            dose: { type: Type.STRING },
                                            route: { type: Type.STRING },
                                            frequency: { type: Type.STRING },
                                            region: { type: Type.STRING },
                                            modality: { type: Type.STRING },
                                            sampleType: { type: Type.STRING },
                                        }
                                    }
                                },
                                required: ['category', 'subType', 'label', 'priority', 'rationale']
                            }
                        }
                    },
                    required: ['suggested_orders']
                }
            }
        });
        const result = JSON.parse(response.text);
        
        // Map rationale to ai_provenance
        return (result.suggested_orders || []).map((o: any) => ({
            ...o,
            ai_provenance: {
                prompt_id: null,
                rationale: o.rationale
            }
        })) as SuggestedOrder[];

    } catch (error) {
        console.error("Error suggesting orders:", error);
        throw error;
    }
};

export const generateRoundSummary = async (doctorNotes: string, vitals?: Vitals): Promise<string> => {
    const context = `
        Doctor's notes for the round: "${doctorNotes}"
        Vitals at time of round: ${vitals ? `HR: ${vitals.hr}, BP: ${vitals.bpSys}/${vitals.bpDia}, SpO2: ${vitals.spo2}%` : 'Not recorded'}.
    `;
    try {
        const response = await ai.models.generateContent({
            model: flashModel,
            contents: `Based on the following notes and vitals from a doctor's round, generate a very brief, one-line summary (e.g., "Patient stable, fever reducing."). \n\n${context}`,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error generating round summary:", error);
        return "Summary generation failed.";
    }
};

export const compileDischargeSummary = async (patient: Patient): Promise<string> => {
    const context = `
        Patient: ${patient.name}, ${patient.age}, ${patient.gender}
        Chief Complaint: ${patient.complaint}
        
        Clinical File Summary:
        ${JSON.stringify(patient.clinicalFile.sections)}
        
        Rounds Summary:
        ${patient.rounds.map(r => `[${new Date(r.timestamp).toLocaleDateString()}] Round ${r.roundNumber}: ${r.summaryText} - ${r.doctorNotes}`).join('\n')}
        
        Final Orders:
        ${patient.orders.filter(o => o.status === 'completed' || o.status === 'sent').map(o => `- ${o.category}: ${o.label}`).join('\n')}
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: proModel,
            contents: `You are a medical scribe AI. Compile a comprehensive, well-formatted discharge summary based on the following patient data. The summary should include: 1. Brief course in hospital, 2. Condition at discharge, 3. Discharge medications, 4. Follow-up advice. \n\n ${context}`,
        });
        return response.text;
    } catch (error) {
        console.error("Error compiling discharge summary:", error);
        throw error;
    }
};

export const getFollowUpQuestions = async (section: keyof ClinicalFileSections, seedText: string): Promise<FollowUpQuestion[]> => {
    try {
        const response = await ai.models.generateContent({
            model: flashModel,
            contents: `You are a clinical history-taking AI. For the "${section}" section, a clinician has provided the following seed information: "${seedText}". Generate 2 to 4 targeted follow-up questions to gather more details. For each question, suggest an answer type ('text' for free-form, 'options' for multiple choice), provide quick option choices if applicable, and include a brief rationale for why the question is clinically relevant.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                       questions: { 
                           type: Type.ARRAY, 
                           items: {
                               type: Type.OBJECT,
                               properties: {
                                   id: { type: Type.STRING, description: "A unique ID for the question, e.g., 'q1'." },
                                   text: { type: Type.STRING, description: "The follow-up question." },
                                   answer_type: { type: Type.STRING, enum: ['text', 'options'] },
                                   quick_options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Optional suggested single-word answers." },
                                   rationale: { type: Type.STRING, description: "Rationale for why this question is important." }
                               },
                               required: ['id', 'text', 'answer_type', 'rationale']
                           }
                       }
                    },
                    required: ['questions']
                }
            }
        });
        const result = JSON.parse(response.text);
        return result.questions || [];
    } catch (error) {
        console.error(`Error getting follow-up questions for ${section}:`, error);
        throw error;
    }
};

export const composeHistoryParagraph = async (section: keyof ClinicalFileSections, seedText: string, answers: Record<string, string>): Promise<ComposedHistory> => {
    const qaText = Object.entries(answers).map(([q, a]) => `Q: ${q}\nA: ${a}`).join('\n');
    try {
        const response = await ai.models.generateContent({
            model: flashModel,
            contents: `You are a clinical documentation assistant. A clinician is documenting the "${section}" section. Based on their initial seed phrase and the follow-up Q&A, compose a concise, professional paragraph for the medical record. \n\nSeed: "${seedText}"\n\nQ&A:\n${qaText}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                       paragraph: { type: Type.STRING, description: "The composed paragraph for the history section." }
                    },
                    required: ['paragraph']
                }
            }
        });
        const result = JSON.parse(response.text);
        return result || { paragraph: "Could not generate summary." };
    } catch (error) {
        console.error(`Error composing history for ${section}:`, error);
        return { paragraph: `Based on the initial report of "${seedText}", the following was noted: ${Object.values(answers).join('. ')}.` }; // Simple fallback
    }
};