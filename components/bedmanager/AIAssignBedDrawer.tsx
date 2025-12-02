
import React, { useState } from 'react';
import { Patient, Ward, Bed } from '../../types';
import { recommendBed, BedRecommendation } from '../../services/aiBedAssignment';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '../ui/sheet';
import { Button } from '../ui/button';
import { SparklesIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { useToast } from '../../contexts/ToastContext';

interface AIAssignBedDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    patient: Patient;
    wards: Ward[];
    onAssign: (wardId: string, roomId: string, bedId: string) => void;
}

export const AIAssignBedDrawer: React.FC<AIAssignBedDrawerProps> = ({ isOpen, onClose, patient, wards, onAssign }) => {
    const [recommendation, setRecommendation] = useState<BedRecommendation | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { addToast } = useToast();

    const handleGetRecommendation = async () => {
        setIsLoading(true);
        try {
            const rec = await recommendBed(patient, wards);
            setRecommendation(rec);
        } catch (e) {
            addToast("Failed to get AI recommendation", 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAssign = () => {
        if (recommendation) {
            onAssign(recommendation.recommended_ward_id, recommendation.recommended_room_id, recommendation.recommended_bed_id);
            onClose();
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="bottom" className="h-[500px] sm:h-[450px]">
                <div className="mx-auto w-full max-w-2xl">
                    <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                            <SparklesIcon className="w-5 h-5 text-purple-500" />
                            AI Bed Assignment
                        </SheetTitle>
                        <SheetDescription>
                            Finding the best bed for {patient.name} based on clinical needs.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="p-4 pb-0">
                        {!recommendation ? (
                            <div className="flex flex-col items-center justify-center py-8 space-y-4">
                                <p className="text-sm text-muted-foreground text-center">
                                    Analyzing patient profile, infectious risks, and ward capacity...
                                </p>
                                <Button onClick={handleGetRecommendation} disabled={isLoading} className="w-full max-w-xs">
                                    {isLoading ? "Analyzing..." : "Get Recommendation"}
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-lg">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-lg text-purple-900 dark:text-purple-200">
                                            Bed {recommendation.recommended_bed_id.split('-').pop()}
                                        </h4>
                                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                    </div>
                                    <p className="text-sm text-purple-800 dark:text-purple-300 mb-1">
                                        Room {recommendation.recommended_room_id} • Ward {recommendation.recommended_ward_id}
                                    </p>
                                    <div className="mt-3 text-xs text-muted-foreground bg-white dark:bg-black/20 p-2 rounded">
                                        <span className="font-semibold">AI Reasoning:</span> {recommendation.reasoning}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <SheetFooter className="mt-6">
                        {recommendation && (
                            <Button onClick={handleAssign} className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white">
                                Confirm Assignment
                            </Button>
                        )}
                        <Button variant="outline" onClick={onClose} className="w-full sm:w-auto mt-2 sm:mt-0">Cancel</Button>
                    </SheetFooter>
                </div>
            </SheetContent>
        </Sheet>
    );
};
