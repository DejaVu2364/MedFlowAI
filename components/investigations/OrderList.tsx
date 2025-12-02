
import React from 'react';
import { InvestigationOrder } from '../../types';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { ArrowUpTrayIcon, DocumentTextIcon, ClockIcon } from '@heroicons/react/24/outline';

interface OrderListProps {
    orders: InvestigationOrder[];
    onUploadClick: (order: InvestigationOrder) => void;
    onViewReportClick: (order: InvestigationOrder) => void;
}

export const OrderList: React.FC<OrderListProps> = ({ orders, onUploadClick, onViewReportClick }) => {
    if (orders.length === 0) {
        return <div className="text-center py-8 text-muted-foreground">No investigations ordered yet.</div>;
    }

    return (
        <div className="space-y-3">
            {orders.map(order => (
                <Card key={order.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${order.type === 'radiology' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                            {order.type === 'radiology' ? <DocumentTextIcon className="w-5 h-5" /> : <SparklesIcon className="w-5 h-5" />}
                            {/* Note: SparklesIcon is not defined here, fixing import below */}
                        </div>
                        <div>
                            <h4 className="font-medium">{order.name}</h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <span>{new Date(order.orderedAt).toLocaleDateString()}</span>
                                {order.priority !== 'routine' && (
                                    <Badge variant={order.priority === 'stat' ? 'destructive' : 'secondary'} className="text-[10px] h-5">
                                        {order.priority.toUpperCase()}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className={`
                            ${order.status === 'completed' ? 'border-green-500 text-green-600 bg-green-50' :
                                order.status === 'processing' ? 'border-blue-500 text-blue-600 bg-blue-50' :
                                    'border-gray-300 text-gray-500'}
                        `}>
                            {order.status}
                        </Badge>

                        {order.status === 'completed' ? (
                            <Button size="sm" variant="outline" onClick={() => onViewReportClick(order)}>
                                View Report
                            </Button>
                        ) : (
                            <Button size="sm" onClick={() => onUploadClick(order)}>
                                <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
                                Upload
                            </Button>
                        )}
                    </div>
                </Card>
            ))}
        </div>
    );
};

// Fix missing icon import locally for this file if needed, or replace
import { SparklesIcon } from '@heroicons/react/24/outline';
