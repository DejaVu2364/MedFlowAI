
import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../App';
import { AppContextType, Patient, PatientStatus } from '../types';
import PatientCard from '../components/PatientCard';
import { PlusIcon, SearchIcon } from '../components/icons';

const DashboardPage: React.FC = () => {
    const { patients, setPage, setSelectedPatientId, isLoading } = useContext(AppContext) as AppContextType;
    const [triageSearchTerm, setTriageSearchTerm] = useState('');

    const patientColumns = useMemo(() => {
        const waitingForTriage = patients
            .filter(p => p.status === 'Waiting for Triage')
            .filter(p => 
                p.name.toLowerCase().includes(triageSearchTerm.toLowerCase())
            );

        const waitingForDoctor = patients.filter(p => p.status === 'Waiting for Doctor');
        const inTreatment = patients.filter(p => p.status === 'In Treatment');
        
        return [
            { title: 'Waiting for Triage', patients: waitingForTriage },
            { title: 'Waiting for Doctor', patients: waitingForDoctor },
            { title: 'In Treatment', patients: inTreatment },
        ];
    }, [patients, triageSearchTerm]);
    
    const handleTriageClick = (patientId: string) => {
        setSelectedPatientId(patientId);
        setPage('triage');
    };

    const handlePatientSelect = (patientId: string) => {
        setSelectedPatientId(patientId);
        setPage('patientDetail');
    };

    if (isLoading && patients.length === 0) {
        return <div className="text-center p-10">Loading patients...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-text-primary">Patient Dashboard</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setPage('reception')}
                        className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-brand-green rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                    >
                        <PlusIcon />
                        <span className="ml-2">New Patient</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {patientColumns.map(col => (
                    <div key={col.title} className="bg-background-tertiary dark:bg-background-primary rounded-lg p-4">
                        <h3 className="font-semibold text-text-secondary mb-4">{col.title} ({col.patients.length})</h3>
                        
                        {col.title === 'Waiting for Triage' && (
                            <div className="relative mb-4">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-text-tertiary">
                                    <SearchIcon />
                                </span>
                                <input
                                    type="text"
                                    placeholder="Search by name..."
                                    value={triageSearchTerm}
                                    onChange={(e) => setTriageSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2 border border-border-color rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm bg-background-primary text-input-text"
                                    aria-label="Search patients for triage"
                                />
                            </div>
                        )}

                        <div className="space-y-4">
                            {col.patients.length > 0 ? (
                                col.patients.map(p => <PatientCard key={p.id} patient={p} onTriageClick={handleTriageClick} onClick={handlePatientSelect} />)
                            ) : (
                                <div className="text-center text-sm text-text-tertiary py-8">
                                    {triageSearchTerm ? `No patients found for "${triageSearchTerm}".` : 'No patients in this queue.'}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DashboardPage;