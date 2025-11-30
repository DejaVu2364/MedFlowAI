import { Patient } from '../types';

export const retrievePatientContext = (patient: Patient): string => {
    if (!patient) return "No patient context available.";

    const vitals = patient.vitals ? `
    Current Vitals:
    - HR: ${patient.vitals.pulse || 'N/A'} bpm
    - BP: ${patient.vitals.bp_sys || '?'}/${patient.vitals.bp_dia || '?'} mmHg
    - SpO2: ${patient.vitals.spo2 || 'N/A'}%
    - Temp: ${patient.vitals.temp_c || 'N/A'}°C
    - RR: ${patient.vitals.rr || 'N/A'} /min
    ` : "No recent vitals.";

    const problems = patient.activeProblems && patient.activeProblems.length > 0
        ? patient.activeProblems.map(p => `- ${p.description} (${p.status})`).join('\n')
        : "No active problems listed.";

    const meds = patient.orders && patient.orders.length > 0
        ? patient.orders
            .filter(o => o.category === 'medication' && (o.status === 'in_progress' || o.status === 'sent'))
            .map(m => `- ${m.label} ${m.instructions || ''} (${m.status})`).join('\n')
        : "No active medications.";

    const recentNotes = patient.timeline && patient.timeline.length > 0
        ? patient.timeline.slice(0, 3).map(t => {
            if (t.type === 'SOAP') return `- [${new Date(t.timestamp).toLocaleTimeString()}] SOAP: ${t.a}`;
            if (t.type === 'TeamNote') return `- [${new Date(t.timestamp).toLocaleTimeString()}] Note: ${t.content}`;
            return `- [${new Date(t.timestamp).toLocaleTimeString()}] Event`;
        }).join('\n')
        : "No recent timeline events.";

    return `
    PATIENT CONTEXT:
    Name: ${patient.name}
    Age: ${patient.age}
    Gender: ${patient.gender}
    UHID: ${patient.id}
    Triage Level: ${patient.triage.level}
    Chief Complaint: ${patient.chiefComplaints?.map(c => c.complaint).join(', ') || 'None'}

    ${vitals}

    Active Problems:
    ${problems}

    Current Medications:
    ${meds}

    Recent Events (Last 24h):
    ${recentNotes}

    Handover Summary:
    ${patient.handoverSummary || "None provided."}
    `;
};
