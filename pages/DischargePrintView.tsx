import React from 'react';
import { useParams } from 'react-router-dom';
import { usePatient } from '../contexts/PatientContext';
import { Separator } from '../components/ui/separator';

const DischargePrintView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { patients } = usePatient();
    const patient = patients.find(p => p.id === id);

    if (!patient || !patient.dischargeSummary) {
        return <div className="p-10 text-center">Loading or No Discharge Summary Found...</div>;
    }

    const summary = patient.dischargeSummary;

    return (
        <div className="max-w-[210mm] mx-auto bg-white min-h-screen p-[20mm] text-black print:p-0 print:max-w-none">
            {/* Header */}
            <div className="flex justify-between items-start mb-8 border-b-2 border-black pb-4">
                <div>
                    <h1 className="text-2xl font-bold uppercase tracking-wide">Discharge Summary</h1>
                    <p className="text-sm font-semibold mt-1">MedFlow General Hospital</p>
                    <p className="text-xs text-gray-600">123 Medical Center Dr, Metropolis</p>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold">{patient.name}</h2>
                    <p className="text-sm">UHID: {patient.id}</p>
                    <p className="text-sm">DOB: {new Date().getFullYear() - patient.age}-01-01 ({patient.age}y)</p>
                </div>
            </div>

            {/* Content Grid */}
            <div className="space-y-6">
                <section>
                    <h3 className="text-sm font-bold uppercase border-b border-gray-300 mb-2 text-slate-700">Final Diagnosis</h3>
                    <p className="text-base font-medium">{summary.finalDiagnosis}</p>
                </section>

                <div className="grid grid-cols-2 gap-8">
                    <section>
                        <h3 className="text-sm font-bold uppercase border-b border-gray-300 mb-2 text-slate-700">Admission Details</h3>
                        <p className="text-sm"><span className="font-semibold">Admitted:</span> {new Date(patient.registrationTime).toLocaleDateString()}</p>
                        <p className="text-sm"><span className="font-semibold">Discharged:</span> {new Date().toLocaleDateString()}</p>
                        <p className="text-sm"><span className="font-semibold">Consultant:</span> Dr. Sarah Chen</p>
                    </section>
                    <section>
                        <h3 className="text-sm font-bold uppercase border-b border-gray-300 mb-2 text-slate-700">Condition at Discharge</h3>
                        <p className="text-sm">{summary.conditionAtDischarge}</p>
                    </section>
                </div>

                <section>
                    <h3 className="text-sm font-bold uppercase border-b border-gray-300 mb-2 text-slate-700">Brief History & Course</h3>
                    <p className="text-sm leading-relaxed mb-2">{summary.briefHistory}</p>
                    <p className="text-sm leading-relaxed">{summary.courseInHospital}</p>
                </section>

                <section>
                    <h3 className="text-sm font-bold uppercase border-b border-gray-300 mb-2 text-slate-700">Treatment Given</h3>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{summary.treatmentGiven}</p>
                </section>

                <section>
                    <h3 className="text-sm font-bold uppercase border-b border-gray-300 mb-2 text-slate-700">Discharge Medications</h3>
                    <table className="w-full text-sm text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-100 border-b border-gray-300">
                                <th className="py-2 px-2">Drug Name</th>
                                <th className="py-2 px-2">Dosage</th>
                                <th className="py-2 px-2">Frequency</th>
                                <th className="py-2 px-2">Duration</th>
                                <th className="py-2 px-2">Instructions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {summary.dischargeMeds?.map((med, i) => (
                                <tr key={i} className="border-b border-gray-200">
                                    <td className="py-2 px-2 font-medium">{med.name}</td>
                                    <td className="py-2 px-2">{med.dosage}</td>
                                    <td className="py-2 px-2">{med.frequency}</td>
                                    <td className="py-2 px-2">{med.duration}</td>
                                    <td className="py-2 px-2 text-gray-600">{med.instructions}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                <div className="grid grid-cols-2 gap-8">
                    <section>
                        <h3 className="text-sm font-bold uppercase border-b border-gray-300 mb-2 text-slate-700">Follow Up</h3>
                        <p className="text-sm whitespace-pre-wrap">{summary.followUpInstructions}</p>
                    </section>
                    <section>
                        <h3 className="text-sm font-bold uppercase border-b border-gray-300 mb-2 text-slate-700">Diet & Activity</h3>
                        <p className="text-sm"><span className="font-semibold">Diet:</span> {summary.dietAdvice}</p>
                        <p className="text-sm"><span className="font-semibold">Activity:</span> {summary.activityAdvice}</p>
                    </section>
                </div>

                {summary.emergencyWarnings && (
                    <section className="border border-red-200 bg-red-50 p-4 rounded-lg print:border-red-300">
                        <h3 className="text-sm font-bold uppercase text-red-700 mb-1">Emergency Warnings</h3>
                        <p className="text-sm text-red-900">{summary.emergencyWarnings}</p>
                    </section>
                )}
            </div>

            {/* Footer */}
            <div className="mt-16 pt-8 border-t border-gray-300 flex justify-between items-end">
                <div className="text-xs text-gray-500">
                    <p>Generated by MedFlow AI</p>
                    <p>{new Date().toLocaleString()}</p>
                </div>
                <div className="text-right">
                    <div className="h-12 w-48 border-b border-black mb-2"></div>
                    <p className="text-sm font-bold">Consultant Signature</p>
                </div>
            </div>

            {/* Print Button (Hidden in Print) */}
            <div className="fixed bottom-8 right-8 print:hidden">
                <button
                    onClick={() => window.print()}
                    className="bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    Print / Save PDF
                </button>
            </div>
        </div>
    );
};

export default DischargePrintView;
