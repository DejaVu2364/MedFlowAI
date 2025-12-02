
import React from 'react';
import { Bed } from '../../types';
import { Card } from '../ui/card';
import { cn } from '../../lib/utils';
import { UserIcon, SparklesIcon, WrenchIcon, ClockIcon } from '@heroicons/react/24/solid';

interface BedTileProps {
    bed: Bed;
    onClick: (bed: Bed) => void;
}

export const BedTile: React.FC<BedTileProps> = ({ bed, onClick }) => {
    const getStatusColor = () => {
        switch (bed.status) {
            case 'occupied': return 'bg-red-100 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300';
            case 'vacant': return 'bg-green-100 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300';
            case 'cleaning': return 'bg-yellow-100 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300';
            case 'maintenance': return 'bg-gray-100 border-gray-200 text-gray-800 dark:bg-gray-900/20 dark:border-gray-800 dark:text-gray-300';
            case 'reserved': return 'bg-blue-100 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300';
            default: return 'bg-gray-100';
        }
    };

    const getStatusIcon = () => {
        switch (bed.status) {
            case 'occupied': return <UserIcon className="w-4 h-4" />;
            case 'vacant': return <div className="w-3 h-3 rounded-full bg-green-500" />;
            case 'cleaning': return <SparklesIcon className="w-4 h-4" />;
            case 'maintenance': return <WrenchIcon className="w-4 h-4" />;
            case 'reserved': return <ClockIcon className="w-4 h-4" />;
        }
    };

    return (
        <Card
            className={cn(
                "p-3 cursor-pointer hover:shadow-md transition-all border-2 flex flex-col gap-2 h-28 justify-between",
                getStatusColor()
            )}
            onClick={() => onClick(bed)}
        >
            <div className="flex justify-between items-start">
                <span className="font-bold text-sm tracking-tight">{bed.id.split('-').pop()}</span>
                {getStatusIcon()}
            </div>

            <div className="text-xs font-medium truncate">
                {bed.status === 'occupied' ? (
                    <span className="flex flex-col">
                        <span>Patient: {bed.patientId?.slice(0, 8)}...</span>
                        {bed.predictedDischargeAt && (
                            <span className="text-[10px] opacity-80 mt-1">
                                Disch: {new Date(bed.predictedDischargeAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                    </span>
                ) : (
                    <span className="capitalize">{bed.status}</span>
                )}
            </div>
        </Card>
    );
};
