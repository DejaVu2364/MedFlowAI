
import React from 'react';
import { Ward } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

interface WardCardProps {
    ward: Ward;
    isSelected: boolean;
    onClick: (wardId: string) => void;
}

export const WardCard: React.FC<WardCardProps> = ({ ward, isSelected, onClick }) => {
    const totalBeds = ward.rooms.reduce((acc, r) => acc + r.beds.length, 0);
    const occupied = ward.rooms.reduce((acc, r) => acc + r.beds.filter(b => b.status === 'occupied').length, 0);
    const cleaning = ward.rooms.reduce((acc, r) => acc + r.beds.filter(b => b.status === 'cleaning').length, 0);
    const vacant = totalBeds - occupied - cleaning; // Simplified, excludes maintenance/reserved for quick view

    return (
        <Card
            className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? 'border-primary ring-1 ring-primary' : 'border-border/50'}`}
            onClick={() => onClick(ward.id)}
        >
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-bold">{ward.name}</CardTitle>
                    <Badge variant="outline" className="text-xs">{ward.department}</Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 bg-red-50 dark:bg-red-900/10 rounded-lg">
                        <div className="font-bold text-red-600 dark:text-red-400 text-lg">{occupied}</div>
                        <div className="text-muted-foreground">Occupied</div>
                    </div>
                    <div className="p-2 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg">
                        <div className="font-bold text-yellow-600 dark:text-yellow-400 text-lg">{cleaning}</div>
                        <div className="text-muted-foreground">Cleaning</div>
                    </div>
                    <div className="p-2 bg-green-50 dark:bg-green-900/10 rounded-lg">
                        <div className="font-bold text-green-600 dark:text-green-400 text-lg">{vacant}</div>
                        <div className="text-muted-foreground">Vacant</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
