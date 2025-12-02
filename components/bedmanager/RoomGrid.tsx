
import React from 'react';
import { Room, Bed } from '../../types';
import { BedTile } from './BedTile';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface RoomGridProps {
    room: Room;
    onBedClick: (bed: Bed) => void;
}

export const RoomGrid: React.FC<RoomGridProps> = ({ room, onBedClick }) => {
    return (
        <Card className="border-border/50 shadow-sm">
            <CardHeader className="py-3 px-4 bg-muted/20 border-b border-border/50">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Room {room.id}</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-3">
                    {room.beds.map(bed => (
                        <BedTile key={bed.id} bed={bed} onClick={onBedClick} />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};
