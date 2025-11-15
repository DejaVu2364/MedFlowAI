import { renderHook, act } from '@testing-library/react';
import { usePatients } from './usePatients';
import * as api from '../services/api';
import { vi } from 'vitest';

vi.mock('../services/api');

describe('usePatients', () => {
  it('should call addPatient service when adding a new patient', async () => {
    const setIsLoading = vi.fn();
    const setError = vi.fn();
    const setPage = vi.fn();
    const setSelectedPatientId = vi.fn();
    const currentUser = { id: 'test-user' };

    const { result } = renderHook(() =>
      usePatients(setIsLoading, setError, setPage, setSelectedPatientId, currentUser)
    );

    const newPatientData = { name: 'John Doe', age: 30, gender: 'Male', complaint: 'Test complaint' };
    const mockNewPatient = { id: '1', ...newPatientData };

    (api.addPatient as vi.Mock).mockResolvedValue(mockNewPatient);

    await act(async () => {
      await result.current.addPatient(newPatientData as any);
    });

    expect(api.addPatient).toHaveBeenCalledWith(newPatientData);
    expect(result.current.patients).toEqual([mockNewPatient]);
    expect(setPage).toHaveBeenCalledWith('dashboard');
  });
});
