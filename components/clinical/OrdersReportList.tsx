import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { FileText, Eye, Download } from 'lucide-react';

interface Report {
    id: string;
    title: string;
    date: string;
    type: 'Lab' | 'Radiology' | 'Other';
    status: 'Final' | 'Preliminary';
}

// Mock Data
const mockReports: Report[] = [
    { id: '1', title: 'Complete Blood Count', date: '2024-05-20', type: 'Lab', status: 'Final' },
    { id: '2', title: 'Chest X-Ray PA View', date: '2024-05-20', type: 'Radiology', status: 'Final' },
    { id: '3', title: 'Serum Electrolytes', date: '2024-05-21', type: 'Lab', status: 'Final' },
];

export const OrdersReportList: React.FC<{ onView: (report: Report) => void }> = ({ onView }) => {
    return (
        <div className="space-y-4">
            {mockReports.map(report => (
                <Card key={report.id} className="border border-border/50 shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-muted rounded-lg">
                                <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm">{report.title}</h4>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                    <span>{report.date}</span>
                                    <span>•</span>
                                    <span>{report.type}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge variant={report.status === 'Final' ? 'default' : 'secondary'} className="text-[10px]">
                                {report.status}
                            </Badge>
                            <Button size="sm" variant="ghost" onClick={() => onView(report)}>
                                <Eye className="w-4 h-4 mr-2" /> View
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};
