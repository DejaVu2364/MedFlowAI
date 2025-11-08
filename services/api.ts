
import { Patient, Vitals, Triage, TriageLevel, TeamNote, SOAPNote, User, AuditEvent, AITriageSuggestion } from '../types';

export const MOCK_DOCTOR: User = { id: 'user-doc-1', name: 'Dr. Carol', email: 'doctor@medflow.ai', role: 'Doctor' };
export const MOCK_INTERN: User = { id: 'user-int-1', name: 'Dr. Alice', email: 'intern@medflow.ai', role: 'Intern' };

// Fix: Add missing user authentication exports for LoginPage.
const MOCK_USERS: User[] = [MOCK_DOCTOR, MOCK_INTERN];

export const MOCK_USER_CREDENTIALS = {
    'doctor@medflow.ai': 'password123',
    'intern@medflow.ai': 'password123',
};

export const findUserByEmail = (email: string): User | undefined => {
    return MOCK_USERS.find(user => user.email.toLowerCase() === email.toLowerCase());
};

const INITIAL_PATIENTS: Omit<Patient, 'id' | 'status' | 'registrationTime' | 'triage' | 'aiTriage' | 'timeline' | 'orders' | 'vitalsHistory' | 'clinicalFile' | 'rounds' | 'dischargeSummary'>[] = [
    { name: 'John Doe', age: 45, gender: 'Male', phone: '555-0101', complaint: 'Severe chest pain and shortness of breath' },
    { name: 'Jane Smith', age: 32, gender: 'Female', phone: '555-0102', complaint: 'Fever, cough, and body aches for 3 days' },
    { name: 'Mike Johnson', age: 28, gender: 'Male', phone: '555-0103', complaint: 'Fell off a ladder, arm is deformed and painful' },
    { name: 'Emily Williams', age: 68, gender: 'Female', phone: '555-0104', complaint: 'Sudden sharp pain in the lower abdomen' },
    { name: 'Sarah Brown', age: 29, gender: 'Female', phone: '555-0105', complaint: 'Routine pregnancy check-up, feeling well' },
    { name: 'David Chen', age: 55, gender: 'Male', phone: '555-0106', complaint: 'Headache and dizziness after a fall' },
    { name: 'Maria Garcia', age: 72, gender: 'Female', phone: '555-0107', complaint: 'Worsening confusion and memory loss noted by family' },
];

const MOCK_NOTES: { author: User; content: string; isEscalation?: boolean }[] = [
    { author: MOCK_INTERN, content: 'Patient reports feeling slightly better. Vitals stable overnight. Continuing current medication.' },
    { author: MOCK_INTERN, content: 'New rash observed on the patient\'s back. Ordering a dermatology consult. Patient is anxious.', isEscalation: true },
    { author: MOCK_DOCTOR, content: 'Consulted with dermatology. Likely a non-serious allergic reaction. Will monitor.' },
];

const MOCK_SOAP: Omit<SOAPNote, 'id' | 'patientId' | 'type' | 'timestamp' | 'author' | 'authorId' | 'role'> = {
    s: 'Patient states chest pain is at a 3/10, improved from 8/10 on admission.',
    o: 'Vitals: HR 78, BP 122/80, RR 16, SpO2 98%. EKG shows normal sinus rhythm.',
    a: 'Acute coronary syndrome, likely unstable angina. Responding well to initial treatment.',
    p: 'Continue nitrates and beta-blockers. Serial troponins. Plan for cardiac catheterization in the morning.'
};


// In-memory store for patients
let patients: Patient[] = [];

// Simulate seeding the database
export const seedPatients = async (): Promise<Patient[]> => {
    // This function will only run once
    if (patients.length > 0) {
        return patients;
    }
    
    const { classifyComplaint } = await import('./geminiService');

    const seededPatients: Patient[] = [];
    const doctor = MOCK_DOCTOR;

    for (const [index, p] of INITIAL_PATIENTS.entries()) {
        const id = `PAT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        
        let aiTriageWithCache: AITriageSuggestion & { fromCache: boolean };
        try {
            // Introduce a delay to avoid hitting API rate limits during seeding.
            if (index > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            const result = await classifyComplaint(p.complaint);
            aiTriageWithCache = { ...result.data, fromCache: result.fromCache };
        } catch (error) {
            console.error(`AI classification failed for seed patient "${p.name}". Using fallback. Error:`, error);
            aiTriageWithCache = {
                department: 'Unknown',
                suggested_triage: 'None',
                confidence: 0,
                fromCache: false
            };
        }
        
        const mockNoteData = MOCK_NOTES[Math.floor(Math.random() * MOCK_NOTES.length)];

        // Add some mock timeline events for RAG context
        const timeline: (TeamNote | SOAPNote)[] = [
            {
                type: 'SOAP',
                id: `SOAP-${id}-1`,
                patientId: id,
                ...MOCK_SOAP,
                author: doctor.name,
                authorId: doctor.id,
                role: doctor.role,
                timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12h ago
            },
            {
                type: 'TeamNote',
                id: `NOTE-${id}-1`,
                patientId: id,
                content: mockNoteData.content,
                isEscalation: mockNoteData.isEscalation,
                author: mockNoteData.author.name,
                authorId: mockNoteData.author.id,
                role: mockNoteData.author.role,
                timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6h ago
            },
        ];

        seededPatients.push({
            ...p,
            id,
            status: 'Waiting for Triage',
            registrationTime: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
            triage: { level: 'None', reasons: [] },
            aiTriage: aiTriageWithCache,
            timeline,
            // Workspace fields
            clinicalFile: { 
                id: `CF-${id}`, 
                patientId: id, 
                status: 'draft',
                aiSuggestions: {},
                sections: {
                    history: {
                        chief_complaint: p.complaint,
                        duration: '3 days',
                        hpi: 'Patient presents with a 3-day history of symptoms.',
                        associated_symptoms: [],
                        allergy_history: [],
                        review_of_systems: {}
                    },
                    gpe: {
                        flags: { pallor: false, icterus: false, cyanosis: false, clubbing: false, lymphadenopathy: false, edema: false }
                    },
                    systemic: {}
                }
            },
            orders: [],
            rounds: [],
            vitalsHistory: [],
        });
    }
    patients = seededPatients;
    // Set some patients to a later stage for a more realistic dashboard
    if (patients.length > 2) {
        const vitals = { hr: 110, bpSys: 130, bpDia: 85, rr: 20, spo2: 97, temp: 38.5};
        patients[1].status = 'Waiting for Doctor';
        patients[1].triage = { level: 'Yellow', reasons: ['High Heart Rate (110 bpm)']};
        patients[1].vitals = vitals;
        patients[1].vitalsHistory = [{...vitals, timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), enteredBy: MOCK_INTERN.id }];
    }
     if (patients.length > 4) {
        const vitals = { hr: 120, bpSys: 100, bpDia: 60, rr: 26, spo2: 88, temp: 37.0};
        patients[3].status = 'In Treatment';
        patients[3].triage = { level: 'Red', reasons: ['Low SpO2 (88%)']};
        patients[3].vitals = vitals;
        patients[3].vitalsHistory = [{...vitals, timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), enteredBy: MOCK_DOCTOR.id }];
        patients[3].clinicalFile.sections.gpe = { ...patients[3].clinicalFile.sections.gpe, vitals, flags: { pallor: true, icterus: false, cyanosis: true, clubbing: false, lymphadenopathy: false, edema: false }};
    }
    return patients;
};

// Rule-based triage scorer (MEWS-style)
export const calculateTriageFromVitals = (vitals: Vitals): Triage => {
    const reasons: string[] = [];
    let level: TriageLevel = 'Green';

    if (vitals.spo2 < 90) {
        reasons.push(`Low SpO2 (${vitals.spo2}%)`);
        level = 'Red';
    }
    if (vitals.bpSys < 90) {
        reasons.push(`Low Systolic BP (${vitals.bpSys} mmHg)`);
        level = 'Red';
    }
    
    if (level !== 'Red') {
        if (vitals.rr > 24) {
            reasons.push(`High Respiratory Rate (${vitals.rr}/min)`);
            level = 'Yellow';
        }
        if (vitals.hr > 120) {
            reasons.push(`High Heart Rate (${vitals.hr} bpm)`);
            level = 'Yellow';
        }
    }

    if (reasons.length === 0) {
        reasons.push('Vitals are stable.');
    }

    return { level, reasons };
};

// Phase 3: Stub for logging audit events to a backend
export const logAuditEventToServer = (event: AuditEvent) => {
    // In a real app, this would be an API call:
    // fetch('/api/audit', { method: 'POST', body: JSON.stringify(event) });
    console.log('--- AUDIT EVENT LOGGED TO SERVER---', event);
};
