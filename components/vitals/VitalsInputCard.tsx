import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { PlusIcon } from '@heroicons/react/24/outline';
import { usePatient } from '../../contexts/PatientContext';
import { VitalsMeasurements } from '../../types';

interface VitalsInputCardProps {
    patientId: string;
    onSave: () => void;
}

export const VitalsInputCard: React.FC<VitalsInputCardProps> = ({ patientId, onSave }) => {
    const { updatePatientVitals, isLoading } = usePatient();
    const [vitals, setVitals] = useState<Partial<VitalsMeasurements> & { pain_score?: number }>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setVitals(prev => ({
            ...prev,
            [name]: value === '' ? undefined : parseFloat(value)
        }));
    };

    const handleSave = async (addAnother: boolean) => {
        await updatePatientVitals(patientId, {
            hr: vitals.pulse || 0,
            bpSys: vitals.bp_sys || 0,
            bpDia: vitals.bp_dia || 0,
            rr: vitals.rr || 0,
            spo2: vitals.spo2 || 0,
            temp: vitals.temp_c || 0,
            // @ts-ignore
            pain_score: vitals.pain_score
        });

        if (!addAnother) {
            onSave();
        }
        setVitals({});
    };

    return (
        <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <PlusIcon className="w-4 h-4 text-primary" />
                    Quick Entry
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">HR (bpm)</Label>
                        <Input name="pulse" type="number" value={vitals.pulse || ''} onChange={handleChange} className="h-8" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">SpO₂ (%)</Label>
                        <Input name="spo2" type="number" value={vitals.spo2 || ''} onChange={handleChange} className="h-8" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">BP (Sys)</Label>
                        <Input name="bp_sys" type="number" value={vitals.bp_sys || ''} onChange={handleChange} className="h-8" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">BP (Dia)</Label>
                        <Input name="bp_dia" type="number" value={vitals.bp_dia || ''} onChange={handleChange} className="h-8" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">RR (/min)</Label>
                        <Input name="rr" type="number" value={vitals.rr || ''} onChange={handleChange} className="h-8" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Temp (°C)</Label>
                        <Input name="temp_c" type="number" value={vitals.temp_c || ''} onChange={handleChange} className="h-8" />
                    </div>
                    <div className="col-span-2 space-y-1">
                        <Label className="text-xs text-muted-foreground">Pain Score (0-10)</Label>
                        <Input name="pain_score" type="number" min="0" max="10" value={vitals.pain_score || ''} onChange={handleChange} className="h-8" />
                    </div>
                </div>
                <div className="flex gap-2 pt-2">
                    <Button className="flex-1" size="sm" onClick={() => handleSave(false)} disabled={isLoading}>
                        Save
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleSave(true)} disabled={isLoading}>
                        + Add Another
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
