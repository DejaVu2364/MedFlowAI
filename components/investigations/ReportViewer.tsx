
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { InvestigationReport } from '../../types';
import { AISummaryCard } from './AISummaryCard';
import { generateReportSummary } from '../../services/aiReportSummary';
import { XMarkIcon, ArrowDownTrayIcon, PrinterIcon } from '@heroicons/react/24/outline';

interface ReportViewerProps {
    isOpen: boolean;
    onClose: () => void;
    report: InvestigationReport;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({ isOpen, onClose, report }) => {
    const [aiAnalysis, setAiAnalysis] = useState<{ summary: string, flags: string[] } | null>(null);
    const [isLoadingAI, setIsLoadingAI] = useState(false);

    useEffect(() => {
        if (isOpen && report && !report.aiSummary) {
            // If no summary exists, generate one
            setIsLoadingAI(true);
            generateReportSummary(report.url, report.format === 'pdf' ? 'pdf' : 'image')
                .then(analysis => {
                    setAiAnalysis(analysis);
                })
                .finally(() => setIsLoadingAI(false));
        } else if (report?.aiSummary) {
            setAiAnalysis({ summary: report.aiSummary, flags: report.aiFlags || [] });
        }
    }, [isOpen, report]);

    if (!report) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
                <div className="flex items-center justify-between p-4 border-b">
                    <div>
                        <DialogTitle>Investigation Report</DialogTitle>
                        <p className="text-sm text-muted-foreground">
                            {new Date(report.uploadedAt).toLocaleString()} • {report.type.toUpperCase()}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" title="Download">
                            <ArrowDownTrayIcon className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon" title="Print">
                            <PrinterIcon className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <XMarkIcon className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Main Viewer Area */}
                    <div className="flex-1 bg-slate-100 dark:bg-slate-900 p-4 overflow-auto flex items-center justify-center">
                        {report.format === 'image' ? (
                            <img src={report.url} alt="Report" className="max-w-full max-h-full object-contain shadow-lg" />
                        ) : (
                            <div className="w-full h-full bg-white flex items-center justify-center text-muted-foreground border shadow-sm">
                                {/* PDF Viewer Placeholder - In real app use <iframe src={report.url} /> or react-pdf */}
                                <div className="text-center">
                                    <p className="mb-2">PDF Viewer</p>
                                    <Button variant="outline" onClick={() => window.open(report.url, '_blank')}>
                                        Open PDF in New Tab
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar for AI & Metadata */}
                    <div className="w-80 border-l bg-background p-4 overflow-y-auto">
                        <h3 className="font-semibold mb-4">Clinical Insights</h3>
                        <AISummaryCard
                            summary={aiAnalysis?.summary || ""}
                            flags={aiAnalysis?.flags}
                            isLoading={isLoadingAI}
                        />

                        <div className="mt-6 space-y-4">
                            <div>
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Patient ID</h4>
                                <p className="text-sm font-mono">{report.patientId}</p>
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Order ID</h4>
                                <p className="text-sm font-mono">{report.orderId}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
