
import React, { useEffect, useState } from 'react';
import { usePatientData } from '../hooks/usePatientData';
import { subscribeToBedState, updateBedStatus, markBedClean, assignPatientToBed, dischargePatientFromBed } from '../services/bedService';
import { predictDischarge } from '../services/aiBedAssignment';
import { BedManagerState, Ward, Bed, Patient } from '../types';
import { WardList } from '../components/bedmanager/WardList';
import { RoomGrid } from '../components/bedmanager/RoomGrid';
import { BedDetailSheet } from '../components/bedmanager/BedDetailSheet';
import { CleaningQueue } from '../components/bedmanager/CleaningQueue';
import { AIAssignBedDrawer } from '../components/bedmanager/AIAssignBedDrawer';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { SparklesIcon, MapIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { useToast } from '../contexts/ToastContext';

export const BedManagerPage: React.FC = () => {
    const { patients } = usePatientData();
    const [bedState, setBedState] = useState<BedManagerState | null>(null);
    const [selectedWardId, setSelectedWardId] = useState<string | null>(null);
    const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isAIDrawerOpen, setIsAIDrawerOpen] = useState(false);
    const [patientToAssign, setPatientToAssign] = useState<Patient | null>(null);
    const { addToast } = useToast();

    useEffect(() => {
        const unsubscribe = subscribeToBedState((state) => {
            setBedState(state);
            if (!selectedWardId && state.wards.length > 0) {
                setSelectedWardId(state.wards[0].id);
            }
        });
        return () => unsubscribe();
    }, []);

    // Effect to run discharge prediction for occupied beds
    useEffect(() => {
        if (!bedState || !patients.length) return;

        const runPredictions = async () => {
            for (const ward of bedState.wards) {
                for (const room of ward.rooms) {
                    for (const bed of room.beds) {
                        if (bed.status === 'occupied' && bed.patientId && !bed.predictedDischargeAt) {
                            const patient = patients.find(p => p.id === bed.patientId);
                            if (patient) {
                                const prediction = await predictDischarge(patient);
                                // Update local state optimistically or db
                                // For now, we'll just log it, or we could update the bed object if we had a way to persist it easily without full re-render loop
                                // In a real app, this would be a backend job.
                                // Let's just update the bed object in memory for display if we can, or skip to avoid complexity.
                            }
                        }
                    }
                }
            }
        };
        // runPredictions(); // Disabled to avoid excessive API calls in demo
    }, [bedState, patients]);

    const handleBedClick = (bed: Bed) => {
        setSelectedBed(bed);
        setIsDetailOpen(true);
    };

    const handleBedAction = async (action: 'clean' | 'occupy' | 'discharge' | 'maintenance', bedId: string) => {
        if (!selectedWardId || !bedState) return;

        // Find room for bedId
        const ward = bedState.wards.find(w => w.id === selectedWardId);
        const room = ward?.rooms.find(r => r.beds.some(b => b.id === bedId));

        if (ward && room) {
            try {
                if (action === 'clean') {
                    await updateBedStatus(ward.id, room.id, bedId, 'cleaning');
                    addToast(`Bed ${bedId} marked for cleaning`, 'success');
                } else if (action === 'discharge') {
                    await dischargePatientFromBed(ward.id, room.id, bedId);
                    addToast(`Patient discharged from ${bedId}`, 'success');
                } else if (action === 'maintenance') {
                    await updateBedStatus(ward.id, room.id, bedId, 'maintenance');
                    addToast(`Bed ${bedId} marked for maintenance`, 'info');
                }
                setIsDetailOpen(false);
            } catch (e) {
                addToast("Failed to update bed status", 'error');
            }
        }
    };

    const handleMarkClean = async (wardId: string, roomId: string, bedId: string) => {
        try {
            await markBedClean(wardId, roomId, bedId);
            addToast(`Bed ${bedId} is now clean and vacant`, 'success');
        } catch (e) {
            addToast("Failed to mark bed as clean", 'error');
        }
    };

    const handleAssignPatient = async (wardId: string, roomId: string, bedId: string) => {
        if (!patientToAssign) return;
        try {
            await assignPatientToBed(wardId, roomId, bedId, patientToAssign.id);
            addToast(`Assigned ${patientToAssign.name} to ${bedId}`, 'success');
            setPatientToAssign(null);
        } catch (e) {
            addToast("Failed to assign bed", 'error');
        }
    };

    const openAIDrawer = () => {
        // For demo, pick the first waiting patient or a mock one
        const waitingPatient = patients.find(p => p.status === 'Waiting for Doctor' || p.status === 'Waiting for Triage');
        if (waitingPatient) {
            setPatientToAssign(waitingPatient);
            setIsAIDrawerOpen(true);
        } else {
            addToast("No patients waiting for bed assignment", 'info');
        }
    };

    if (!bedState) return <div className="p-8 text-center">Loading Bed Manager...</div>;

    const selectedWard = bedState.wards.find(w => w.id === selectedWardId);

    return (
        <div className="container mx-auto p-6 max-w-7xl space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Bed Manager</h1>
                    <p className="text-muted-foreground">Real-time occupancy and flow management</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={openAIDrawer} className="bg-purple-600 hover:bg-purple-700 text-white">
                        <SparklesIcon className="w-4 h-4 mr-2" />
                        AI Bed Assignment
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="map" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="map">
                        <MapIcon className="w-4 h-4 mr-2" />
                        Ward Map
                    </TabsTrigger>
                    <TabsTrigger value="cleaning">
                        <SparklesIcon className="w-4 h-4 mr-2" />
                        Cleaning Queue
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="map" className="mt-6 space-y-6">
                    <WardList
                        wards={bedState.wards}
                        selectedWardId={selectedWardId}
                        onSelectWard={setSelectedWardId}
                    />

                    {selectedWard && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {selectedWard.rooms.map(room => (
                                <RoomGrid
                                    key={room.id}
                                    room={room}
                                    onBedClick={handleBedClick}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="cleaning" className="mt-6">
                    <div className="max-w-3xl mx-auto">
                        <CleaningQueue wards={bedState.wards} onMarkClean={handleMarkClean} />
                    </div>
                </TabsContent>
            </Tabs>

            <BedDetailSheet
                bed={selectedBed}
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                onAction={handleBedAction}
                patient={selectedBed?.patientId ? patients.find(p => p.id === selectedBed.patientId) : undefined}
            />

            {patientToAssign && (
                <AIAssignBedDrawer
                    isOpen={isAIDrawerOpen}
                    onClose={() => setIsAIDrawerOpen(false)}
                    patient={patientToAssign}
                    wards={bedState.wards}
                    onAssign={handleAssignPatient}
                />
            )}
        </div>
    );
};
