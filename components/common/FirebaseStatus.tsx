import React from 'react';
import { cn } from '../../lib/utils';

interface FirebaseStatusProps {
    online: boolean;
    className?: string;
}

export const FirebaseStatus: React.FC<FirebaseStatusProps> = ({ online, className }) => {
    return (
        <div className={cn("flex items-center gap-2", className)} title={online ? "Online" : "Offline Mode"}>
            <div className={cn(
                "w-3 h-3 rounded-full transition-all duration-300",
                online
                    ? "bg-green-500 shadow-[0_0_6px_2px_rgba(34,197,94,0.6)]"
                    : "bg-red-500 shadow-[0_0_6px_2px_rgba(239,68,68,0.6)]"
            )} />
            <span className="text-xs font-medium text-muted-foreground hidden sm:inline-block">
                {online ? "Online" : "Offline Mode"}
            </span>
        </div>
    );
};
