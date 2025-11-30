import { Patient } from '../types';

export const STATIC_PATIENTS: Patient[] = [
    {
        id: 'PAT-001',
        name: 'James Wilson',
        age: 45,
        gender: 'Male',
        contact: '555-0101',
        status: 'In Treatment',
        registrationTime: new Date().toISOString(),
        triage: { level: 'Yellow', reasons: [] },
        chiefComplaints: [{
            complaint: 'Chest pain and shortness of breath',
            durationValue: 2,
            durationUnit: 'days'
        }],
        vitals: {
            pulse: 92,
            bp_sys: 145,
            bp_dia: 90,
            spo2: 96,
            temp_c: 37.2,
            rr: 20,
            pain_score: 4,
            urine_output_ml: 50,
            glucose_mg_dl: 110
        },
        vitalsHistory: [],
        timeline: [],
        clinicalFile: {
            id: 'CF-PAT-001',
            patientId: 'PAT-001',
            status: 'draft',
            sections: {
                history: { hpi: 'Patient has a history of hypertension and hyperlipidemia. Presents with 2 days of worsening chest pain.', complaints: [{ symptom: 'Chest pain', duration: '2 days' }] },
                gpe: { remarks: 'Chest clear on auscultation. Heart sounds S1+S2 normal. No murmurs.', flags: { pallor: false, icterus: false, cyanosis: false, clubbing: false, lymphadenopathy: false, edema: false } },
                systemic: {}
            }
        },
        orders: [
            { orderId: 'ORD-101', patientId: 'PAT-001', createdBy: 'doc-1', createdAt: new Date().toISOString(), category: 'investigation', label: 'Troponin I', status: 'sent', priority: 'urgent', subType: '', payload: {} },
            { orderId: 'ORD-102', patientId: 'PAT-001', createdBy: 'doc-1', createdAt: new Date().toISOString(), category: 'medication', label: 'Aspirin 300mg', status: 'completed', priority: 'STAT', subType: '', payload: {} }
        ],
        results: [],
        rounds: [],
        activeProblems: [
            { id: 'PROB-1', description: 'Acute Coronary Syndrome', status: 'urgent' },
            { id: 'PROB-2', description: 'Hypertension', status: 'monitor' }
        ],
        handoverSummary: 'Stable overnight. Awaiting Troponin results. Pain controlled.'
    },
    {
        id: 'PAT-002',
        name: 'Sarah Chen',
        age: 28,
        gender: 'Female',
        contact: '555-0102',
        status: 'Waiting for Doctor',
        registrationTime: new Date().toISOString(),
        triage: { level: 'Green', reasons: [] },
        chiefComplaints: [{
            complaint: 'Abdominal pain',
            durationValue: 2,
            durationUnit: 'days'
        }],
        vitals: {
            pulse: 88,
            bp_sys: 110,
            bp_dia: 70,
            spo2: 99,
            temp_c: 36.8,
            rr: 16,
            pain_score: 6
        },
        vitalsHistory: [],
        timeline: [],
        clinicalFile: {
            id: 'CF-PAT-002',
            patientId: 'PAT-002',
            status: 'draft',
            sections: {
                history: { hpi: '2 day history of RLQ pain. Nausea but no vomiting.', complaints: [{ symptom: 'Abdominal pain', duration: '2 days' }] },
                gpe: { remarks: 'Tenderness at McBurney\'s point. Rebound tenderness positive.', flags: { pallor: false, icterus: false, cyanosis: false, clubbing: false, lymphadenopathy: false, edema: false } },
                systemic: {}
            }
        },
        orders: [],
        results: [],
        rounds: [],
        activeProblems: [
            { id: 'PROB-3', description: 'Suspected Appendicitis', status: 'urgent' }
        ],
        handoverSummary: 'NPO. Scheduled for USG Abdomen.'
    },
    {
        id: 'PAT-003',
        name: 'Robert Johnson',
        age: 72,
        gender: 'Male',
        contact: '555-0103',
        status: 'In Treatment',
        registrationTime: new Date().toISOString(),
        triage: { level: 'Red', reasons: [] },
        chiefComplaints: [{
            complaint: 'Severe Dyspnea',
            durationValue: 1,
            durationUnit: 'weeks'
        }],
        vitals: {
            pulse: 110,
            bp_sys: 90,
            bp_dia: 60,
            spo2: 88,
            temp_c: 38.5,
            rr: 28
        },
        vitalsHistory: [],
        timeline: [],
        clinicalFile: {
            id: 'CF-PAT-003',
            patientId: 'PAT-003',
            status: 'draft',
            sections: {
                history: { hpi: 'COPD exacerbation. Productive cough for 1 week.', complaints: [{ symptom: 'Dyspnea', duration: '1 week' }] },
                gpe: { remarks: 'Respiratory distress.', flags: { pallor: false, icterus: false, cyanosis: true, clubbing: true, lymphadenopathy: false, edema: false } },
                systemic: {}
            }
        },
        orders: [],
        results: [],
        rounds: [],
        activeProblems: [
            { id: 'PROB-4', description: 'COPD Exacerbation', status: 'urgent' },
            { id: 'PROB-5', description: 'Pneumonia', status: 'urgent' }
        ],
        handoverSummary: 'Critical. On BiPAP. Monitor SpO2 closely.'
    }
];
