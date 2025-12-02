
import React from 'react';
import { Ward } from '../../types';
import { WardCard } from './WardCard';

interface WardListProps {
    wards: Ward[];
    selectedWardId: string | null;
    onSelectWard: (wardId: string) => void;
}

export const WardList: React.FC<WardListProps> = ({ wards, selectedWardId, onSelectWard }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {wards.map(ward => (
                <WardCard
                    key={ward.id}
                    ward={ward}
                    isSelected={ward.id === selectedWardId}
                    onClick={onSelectWard}
                />
            ))}
        </div>
    );
};
