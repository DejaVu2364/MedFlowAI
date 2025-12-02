
import React from 'react';
import { Bed, Ward } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { SparklesIcon, ClockIcon } from '@heroicons/react/24/outline';

interface CleaningQueueProps {
    wards: Ward[];
    onMarkClean: (wardId: string, roomId: string, bedId: string) => void;
}

export const CleaningQueue: React.FC<CleaningQueueProps> = ({ wards, onMarkClean }) => {
    // Flatten beds to find cleaning ones
    const cleaningBeds = wards.flatMap(w =>
        w.rooms.flatMap(r =>
            r.beds.filter(b => b.status === 'cleaning').map(b => ({
                wardId: w.id,
                wardName: w.name,
                roomId: r.id,
                bed: b
            }))
        )
    );

    return (
        <Card className="h-full border-border/50">
            <CardHeader className="bg-yellow-50/50 dark:bg-yellow-900/10 border-b border-border/50">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <SparklesIcon className="w-5 h-5 text-yellow-600" />
                    Cleaning Queue
                    <span className="ml-auto bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 text-xs px-2 py-1 rounded-full">
                        {cleaningBeds.length}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto max-h-[600px]">
                {cleaningBeds.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        <SparklesIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No beds currently need cleaning.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border/50">
                        {cleaningBeds.map(({ wardId, wardName, roomId, bed }) => (
                            <div key={bed.id} className="p-4 hover:bg-muted/20 transition-colors flex items-center justify-between">
                                <div>
                                    <h4 className="font-semibold text-sm">Bed {bed.id.split('-').pop()}</h4>
                                    <p className="text-xs text-muted-foreground">{wardName} • Room {roomId}</p>
                                    <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                                        <ClockIcon className="w-3 h-3" />
                                        <span>Since {new Date(bed.lastCleanedAt).toLocaleTimeString()}</span>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs"
                                    onClick={() => onMarkClean(wardId, roomId, bed.id)}
                                >
                                    Mark Clean
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
