import React from 'react';
import { Badge } from '../ui/badge';
import { ExclamationTriangleIcon, CheckCircleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

interface RiskBadgeProps {
    riskLevel: 'high' | 'medium' | 'low' | 'stable';
    className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ riskLevel, className }) => {
    switch (riskLevel) {
        case 'high':
            return (
                <Badge variant="destructive" className={`gap-1 ${className}`}>
                    <ExclamationTriangleIcon className="w-3 h-3" />
                    High Risk
                </Badge>
            );
        case 'medium':
            return (
                <Badge variant="secondary" className={`bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200 gap-1 ${className}`}>
                    <ExclamationTriangleIcon className="w-3 h-3" />
                    Medium Risk
                </Badge>
            );
        case 'low':
            return (
                <Badge variant="outline" className={`text-blue-600 border-blue-200 bg-blue-50 gap-1 ${className}`}>
                    <ShieldCheckIcon className="w-3 h-3" />
                    Low Risk
                </Badge>
            );
        case 'stable':
        default:
            return (
                <Badge variant="outline" className={`text-green-600 border-green-200 bg-green-50 gap-1 ${className}`}>
                    <CheckCircleIcon className="w-3 h-3" />
                    Stable
                </Badge>
            );
    }
};
