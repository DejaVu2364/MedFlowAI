




import { Patient, Vitals, Triage, TriageLevel, TeamNote, SOAPNote, User, AuditEvent, AITriageSuggestion, Round, Result, VitalsRecord, VitalsMeasurements } from '../types';

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

const INITIAL_PATIENTS: Omit<Patient, 'id' | 'status' | 'registrationTime' | 'triage' | 'aiTriage' | 'timeline' | 'orders' | 'vitalsHistory' | 'clinicalFile' | 'rounds' | 'dischargeSummary' | 'results' | 'vitals'>[] = [
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
            results: [],
            rounds: [],
            vitalsHistory: [],
        });
    }
    patients = seededPatients;
    // Set some patients to a later stage for a more realistic dashboard
    if (patients.length > 2) {
        const vitals: VitalsMeasurements = { pulse: 110, bp_sys: 130, bp_dia: 85, rr: 20, spo2: 97, temp_c: 38.5};
        patients[1].status = 'Waiting for Doctor';
        patients[1].triage = { level: 'Yellow', reasons: ['High Heart Rate (110 bpm)']};
        patients[1].vitals = vitals;
        patients[1].vitalsHistory = [{
            vitalId: `VIT-${patients[1].id}-1`,
            patientId: patients[1].id,
            recordedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            recordedBy: MOCK_INTERN.id,
            source: 'manual',
            measurements: vitals,
        }];
    }
     if (patients.length > 4) {
        const vitals: VitalsMeasurements = { pulse: 120, bp_sys: 100, bp_dia: 60, rr: 26, spo2: 88, temp_c: 37.0};
        const patientId = patients[3].id;
        
        const sampleSignedRound: Round = {
            roundId: `RND-${patientId}-1`,
            patientId: patientId,
            doctorId: MOCK_DOCTOR.id,
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            status: 'signed',
            subjective: "Patient reports worsening abdominal pain, now localized to the right lower quadrant. Describes it as sharp and constant.",
            objective: "Vitals: See chart. Abdominal exam reveals marked tenderness and guarding in RLQ. Rebound tenderness present. Bowel sounds hypoactive.",
            assessment: "Acute appendicitis highly likely.",
            plan: {
                text: "1. NPO. 2. IV fluids. 3. STAT surgical consult. 4. Pre-op labs (CBC, BMP, Coags). 5. Pain control with IV morphine.",
                linkedOrders: [],
            },
            linkedResults: [],
            signedBy: MOCK_DOCTOR.id,
            signedAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
        };
        
        const mockResults: Result[] = [
            { resultId: 'RES-1', patientId, orderId: 'ORD-1', type: 'lab', name: 'Hemoglobin', timestamp: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(), status: 'final', isAbnormal: false, value: '14.1', unit: 'g/dL', referenceRange: '13.5-17.5' },
            { resultId: 'RES-2', patientId, orderId: 'ORD-1', type: 'lab', name: 'WBC Count', timestamp: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(), status: 'final', isAbnormal: true, value: '18.5', unit: 'x10^9/L', referenceRange: '4.5-11.0' },
            { resultId: 'RES-3', patientId, orderId: 'ORD-2', type: 'imaging', name: 'CT Abdomen', timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(), status: 'final', isAbnormal: true, value: 'Findings consistent with acute appendicitis.', reportUrl: '#' },
            { resultId: 'RES-4', patientId, orderId: 'ORD-1', type: 'lab', name: 'WBC Count', timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), status: 'final', isAbnormal: true, value: '16.2', unit: 'x10^9/L', referenceRange: '4.5-11.0', delta: { previousValue: '18.5', change: 'decrease' } },
        ];

        patients[3].status = 'In Treatment';
        patients[3].triage = { level: 'Red', reasons: ['Low SpO2 (88%)']};
        patients[3].vitals = vitals;
        patients[3].vitalsHistory = [{
            vitalId: `VIT-${patients[3].id}-1`,
            patientId: patients[3].id,
            recordedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            recordedBy: MOCK_DOCTOR.id,
            source: 'manual',
            measurements: vitals
        }];
        patients[3].clinicalFile.sections.gpe = { ...patients[3].clinicalFile.sections.gpe, vitals, flags: { pallor: true, icterus: false, cyanosis: true, clubbing: false, lymphadenopathy: false, edema: false }};
        patients[3].rounds = [sampleSignedRound];
        patients[3].results = mockResults;
    }
    return patients;
};

// Rule-based triage scorer (MEWS-style)
export const calculateTriageFromVitals = (vitals: VitalsMeasurements): Triage => {
    const reasons: string[] = [];
    let level: TriageLevel = 'Green';

    if (vitals.spo2 != null && vitals.spo2 < 90) {
        reasons.push(`Low SpO2 (${vitals.spo2}%)`);
        level = 'Red';
    }
    if (vitals.bp_sys != null && vitals.bp_sys < 90) {
        reasons.push(`Low Systolic BP (${vitals.bp_sys} mmHg)`);
        level = 'Red';
    }
    
    if (level !== 'Red') {
        if (vitals.rr != null && vitals.rr > 24) {
            reasons.push(`High Respiratory Rate (${vitals.rr}/min)`);
            level = 'Yellow';
        }
        if (vitals.pulse != null && vitals.pulse > 120) {
            reasons.push(`High Heart Rate (${vitals.pulse} bpm)`);
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