import { useState, useCallback } from 'react';
import { Patient, Vitals, VitalsRecord, VitalsMeasurements } from '../types';
import { calculateTriageFromVitals, addPatient as addPatientService, updatePatient } from '../services/api';

export const usePatients = (
  setIsLoading: (isLoading: boolean) => void,
  setError: (error: string | null) => void,
  setPage: (page: any) => void,
  setSelectedPatientId: (id: string | null) => void,
  currentUser: any
) => {
  const [patients, setPatients] = useState<Patient[]>([]);

  const addPatient = useCallback(async (patientData: Omit<Patient, 'id'>) => {
    setIsLoading(true);
    setError(null);
    try {
      const newPatient = await addPatientService(patientData);
      setPatients(prev => [newPatient, ...prev]);
      setPage('dashboard');
    } catch (error) {
      setError('Failed to add patient.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setError, setPage]);

  const updatePatientVitals = useCallback(async (patientId: string, vitals: Vitals) => {
    setIsLoading(true);
    setError(null);
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
      const updatedPatient = await updatePatient(patientId, { vitals: measurements, triage, status: 'Waiting for Doctor' });

      setPatients(prev =>
        prev.map(p => (p.id === patientId ? updatedPatient : p))
      );
      setPage('dashboard');
      setSelectedPatientId(null);
    } catch (e) {
      setError('Failed to process vitals.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, setIsLoading, setError, setPage, setSelectedPatientId]);

  return {
    patients,
    setPatients,
    addPatient,
    updatePatientVitals,
  };
};
