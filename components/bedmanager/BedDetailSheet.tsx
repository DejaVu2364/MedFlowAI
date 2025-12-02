
import React from 'react';
import { Bed, Patient } from '../../types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '../ui/sheet';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { UserIcon, ClockIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface BedDetailSheetProps {
    bed: Bed | null;
    isOpen: boolean;
    onClose: () => void;
    onAction: (action: 'clean' | 'occupy' | 'discharge' | 'maintenance', bedId: string) => void;
    patient?: Patient; // If occupied, pass patient details
}

export const BedDetailSheet: React.FC<BedDetailSheetProps> = ({ bed, isOpen, onClose, onAction, patient }) => {
    if (!bed) return null;

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="sm:max-w-md">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        Bed {bed.id}
                        <Badge variant={bed.status === 'occupied' ? 'destructive' : bed.status === 'vacant' ? 'default' : 'secondary'}>
                            {bed.status}
                        </Badge>
                    </SheetTitle>
                    <SheetDescription>
                        Manage bed status and patient assignment.
                    </SheetDescription>
                </SheetHeader>

                <div className="py-6 space-y-6">
                    {bed.status === 'occupied' && patient ? (
                        <div className="space-y-4">
                            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                                <UserIcon className="w-10 h-10 text-muted-foreground p-2 bg-background rounded-full border" />
                                <div>
                                    <h4 className="font-semibold text-lg">{patient.name}</h4>
                                    <p className="text-sm text-muted-foreground">{patient.age}y / {patient.gender}</p>
                                    <p className="text-xs font-mono mt-1 text-muted-foreground">ID: {patient.id}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground">Admission</span>
                                    <p className="text-sm font-medium">{new Date(patient.registrationTime).toLocaleDateString()}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground">Occupied Since</span>
                                    <p className="text-sm font-medium">{bed.occupiedSince ? new Date(bed.occupiedSince).toLocaleString() : '-'}</p>
                                </div>
                            </div>

                            {bed.predictedDischargeAt && (
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                        <ClockIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">Predicted Discharge</span>
                                    </div>
                                    <p className="text-lg font-bold text-blue-900 dark:text-blue-200">
                                        {new Date(bed.predictedDischargeAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                        AI Confidence: High
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>Bed is currently {bed.status}.</p>
                            {bed.status === 'vacant' && <p className="text-sm">Ready for new patient assignment.</p>}
                            {bed.status === 'cleaning' && <p className="text-sm">Housekeeping in progress.</p>}
                        </div>
                    )}

                    <Separator />

                    <div className="space-y-2">
                        <h4 className="text-sm font-medium mb-3">Actions</h4>
                        <div className="grid grid-cols-1 gap-2">
                            {bed.status === 'occupied' && (
                                <>
                                    <Button variant="outline" onClick={() => onAction('discharge', bed.id)}>
                                        Release Bed (Discharge)
                                    </Button>
                                    <Button variant="secondary" onClick={() => onAction('clean', bed.id)}>
                                        Mark as Cleaning
                                    </Button>
                                </>
                            )}
                            {bed.status === 'cleaning' && (
                                <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => onAction('clean', bed.id)}>
                                    <SparklesIcon className="w-4 h-4 mr-2" />
                                    Mark as Cleaned
                                </Button>
                            )}
                            {bed.status === 'vacant' && (
                                <Button variant="outline" onClick={() => onAction('maintenance', bed.id)}>
                                    Mark for Maintenance
                                </Button>
                            )}
                            {bed.status === 'maintenance' && (
                                <Button variant="outline" onClick={() => onAction('clean', bed.id)}>
                                    End Maintenance
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
};
