
import { Patient, Vitals, Triage, TriageLevel, TeamNote, SOAPNote, User, AuditEvent, AITriageSuggestion, Round, Result, VitalsRecord, VitalsMeasurements } from '../types';

export const MOCK_DOCTOR: User = { id: 'user-doc-1', name: 'Dr. Harikrishnan S', email: 'doctor@medflow.ai', role: 'Doctor' };
export const MOCK_INTERN: User = { id: 'user-int-1', name: 'Dr. Rohan Joshi', email: 'intern@medflow.ai', role: 'Intern' };

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
    { name: 'Aarav Sharma', age: 45, gender: 'Male', phone: '555-0101', complaint: 'Severe chest pain and shortness of breath' },
    { name: 'Diya Patel', age: 32, gender: 'Female', phone: '555-0102', complaint: 'Fever, cough, and body aches for 3 days' },
    { name: 'Vihaan Singh', age: 28, gender: 'Male', phone: '555-0103', complaint: 'Fell off a ladder, arm is deformed and painful' },
    { name: 'Ananya Gupta', age: 68, gender: 'Female', phone: '555-0104', complaint: 'Sudden sharp pain in the lower abdomen' },
    { name: 'Ishaan Kumar', age: 29, gender: 'Female', phone: '555-0105', complaint: 'Routine pregnancy check-up, feeling well' },
    { name: 'Saanvi Reddy', age: 55, gender: 'Male', phone: '555-0106', complaint: 'Headache and dizziness after a fall' },
    { name: 'Advait Joshi', age: 72, gender: 'Female', phone: '555-0107', complaint: 'Worsening confusion and memory loss noted by family' },
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


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// In-memory store for patients
let patients: Patient[] = [];

// Simulate seeding the database
export const seedPatients = async (): Promise<Patient[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/patients`);
        if (!response.ok) {
            throw new Error('Failed to fetch patients');
        }
        const data = await response.json();
        patients = data;
        return patients;
    } catch (error) {
        console.error('Error fetching patients:', error);
        return [];
    }
};

export const addPatient = async (patientData: Omit<Patient, 'id'>): Promise<Patient> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/patients`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(patientData),
        });
        if (!response.ok) {
            throw new Error('Failed to add patient');
        }
        const newPatient = await response.json();
        patients.push(newPatient);
        return newPatient;
    } catch (error) {
        console.error('Error adding patient:', error);
        throw error;
    }
};

export const updatePatient = async (patientId: string, patientData: Partial<Patient>): Promise<Patient> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/patients/${patientId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(patientData),
        });
        if (!response.ok) {
            throw new Error('Failed to update patient');
        }
        const updatedPatient = await response.json();
        const patientIndex = patients.findIndex(p => p.id === patientId);
        if (patientIndex !== -1) {
            patients[patientIndex] = updatedPatient;
        }
        return updatedPatient;
    } catch (error) {
        console.error('Error updating patient:', error);
        throw error;
    }
};

export const deletePatient = async (patientId: string): Promise<void> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/patients/${patientId}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error('Failed to delete patient');
        }
        patients = patients.filter(p => p.id !== patientId);
    } catch (error) {
        console.error('Error deleting patient:', error);
        throw error;
    }
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
