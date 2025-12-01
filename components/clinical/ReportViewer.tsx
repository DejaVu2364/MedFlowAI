import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Download, Printer } from 'lucide-react';

interface Report {
    id: string;
    title: string;
    date: string;
    type: 'Lab' | 'Radiology' | 'Other';
    status: 'Final' | 'Preliminary';
}

interface ReportViewerProps {
    report: Report | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({ report, open, onOpenChange }) => {
    // Critical Fix 8: Fallback for null report
    if (!report) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{report.title}</DialogTitle>
                    <DialogDescription>
                        {report.type} Report • {report.date} • {report.status}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 bg-muted/30 rounded-md border p-8 overflow-y-auto">
                    {/* Mock Content */}
                    <div className="bg-white shadow-sm p-8 min-h-[600px] max-w-[800px] mx-auto text-sm font-mono">
                        <div className="text-center mb-8 border-b pb-4">
                            <h1 className="text-xl font-bold">MedFlow Hospital</h1>
                            <p className="text-muted-foreground">Department of {report.type === 'Lab' ? 'Pathology' : 'Radiology'}</p>
                        </div>

                        <div className="mb-6">
                            <p><strong>Patient ID:</strong> PAT-12345</p>
                            <p><strong>Report ID:</strong> {report.id}</p>
                            <p><strong>Date:</strong> {report.date}</p>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-bold border-b w-fit">Findings</h3>
                            <p>
                                {report.type === 'Lab'
                                    ? "WBC: 8.5 (Normal)\nRBC: 4.8 (Normal)\nHgb: 14.2 (Normal)\nPlt: 250 (Normal)\n\nInterpretation: Normal CBC."
                                    : "Lungs are clear. No pleural effusion or pneumothorax. Heart size is normal. Bones are intact.\n\nImpression: Normal Chest X-Ray."}
                            </p>
                        </div>

                        <div className="mt-12 pt-4 border-t">
                            <p>Signed,</p>
                            <p>Dr. Generic</p>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" size="sm">
                        <Printer className="w-4 h-4 mr-2" /> Print
                    </Button>
                    <Button size="sm">
                        <Download className="w-4 h-4 mr-2" /> Download PDF
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
