import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export const AlertsCard: React.FC<{ alerts: string[] }> = ({ alerts }) => {
    if (alerts.length === 0) return null;
    return (
        <Card className="bg-red-50/50 dark:bg-red-950/10 border-red-100 dark:border-red-900 shadow-sm mt-4">
            <CardHeader className="pb-2 flex flex-row items-center gap-2">
                <ExclamationTriangleIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                <CardTitle className="text-sm font-semibold text-red-900 dark:text-red-300">Active Alerts</CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2">
                    {alerts.map((alert, i) => (
                        <li key={i} className="text-xs text-red-800 dark:text-red-200 font-medium flex gap-2">
                            <span className="block w-1.5 h-1.5 rounded-sm bg-red-500 mt-1 shrink-0" />
                            {alert}
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
};
