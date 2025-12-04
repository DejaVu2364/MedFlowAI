import { useEffect, useState } from 'react';
import { Patient, ClinicalFile } from '../types';
import { isTestMode } from '../lib/utils';

// Mock Consistency Check Logic
// In production, this would call Gemini with the full context.

export const useConsistencyEngine = (patient: Patient) => {
    const [inconsistencies, setInconsistencies] = useState<string[]>([]);
    const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('low');

    useEffect(() => {
        if (!patient || isTestMode) return; // Disable in Test Mode

        const checks: string[] = [];
        const file = patient.clinicalFile;

        // 1. Check SpO2 vs Respiratory System
        // If RS is "Clear" but SpO2 < 92
        const spo2 = patient.vitals?.spo2;
        const rs = file?.systemic?.rs || '';

        if (spo2 && spo2 < 94 && rs.toLowerCase().includes('clear')) {
            checks.push(`SpO2 is low (${spo2}%) but Respiratory System examination is recorded as 'Clear'.`);
        }

        // 2. Check Pulse vs CVS
        // If Bradycardia (<60) but CVS says "Normal"
        const hr = patient.vitals?.pulse;
        const cvs = file?.systemic?.cvs || '';
        if (hr && hr < 60 && cvs.toLowerCase().includes('normal')) {
            checks.push(`Bradycardia (${hr} bpm) detected but CVS exam marked as normal.`);
        }

        // 3. Gender specific checks
        if (patient.gender === 'Male' && file?.gpe?.toLowerCase().includes('pregnant')) {
            checks.push('Patient is Male but GPE mentions pregnancy.');
        }

        setInconsistencies(checks);
        setSeverity(checks.length > 0 ? 'medium' : 'low');

    }, [patient, patient.clinicalFile, patient.vitals]);

    return { inconsistencies: isTestMode ? [] : inconsistencies, severity };
};
