import React from 'react';
import { InvestigationOrder, InvestigationReport } from '../../types';
import { FileText, Image as ImageIcon, Download, Maximize2, X, AlertTriangle, Wand2, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@radix-ui/react-dialog';
import { isTestMode } from '../../lib/utils';

interface ReportViewerProps {
    report: InvestigationReport | null;
    open: boolean;
    onClose: () => void;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({ report, open, onClose }) => {
    // --- TEST MODE OVERRIDE ---
    if (isTestMode && open) {
        return (
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6">
                    <DialogHeader>
                        <DialogTitle>Report Viewer</DialogTitle>
                    </DialogHeader>
                    <div className="py-8 text-center" data-testid="report-placeholder">
                        <p className="text-zinc-500">Report Preview Disabled in Test Mode</p>
                    </div>
                    <div className="flex justify-end">
                        <button onClick={onClose} className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded">Close</button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    if (!report) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-zinc-950">
                <DialogHeader className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-lg ${report.type === 'radiology' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                            {report.type === 'radiology' ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                                {report.type === 'radiology' ? 'Radiology Report' : 'Lab Result'}
                            </DialogTitle>
                            <p className="text-xs text-zinc-500">Uploaded {new Date(report.uploadedAt).toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                            <Download className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                            <X className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                        </button>
                    </div>
                </DialogHeader>

                <div className="flex-1 flex overflow-hidden">
                    {/* Main Viewer Area */}
                    <div className="flex-1 bg-zinc-100 dark:bg-zinc-900 overflow-auto flex items-center justify-center p-4">
                        {report.format === 'image' ? (
                            <img src={report.url} alt="Report" className="max-w-full max-h-full object-contain shadow-lg rounded" />
                        ) : report.format === 'pdf' ? (
                            <iframe src={report.url} className="w-full h-full rounded shadow-lg bg-white" title="PDF Report" />
                        ) : (
                            <div className="bg-white p-8 shadow-lg max-w-2xl w-full h-full overflow-auto">
                                <pre className="whitespace-pre-wrap font-mono text-sm">{/* Text content would go here if available */ "Text content not available via URL."}</pre>
                            </div>
                        )}
                    </div>

                    {/* AI Sidebar */}
                    <div className="w-80 border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 overflow-y-auto">
                        <div className="mb-6">
                            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
                                <Wand2 className="w-4 h-4 text-indigo-500" /> AI Analysis
                            </h3>

                            {report.aiSummary ? (
                                <div className="bg-indigo-50 dark:bg-indigo-900/10 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
                                    <p className="text-sm text-indigo-900 dark:text-indigo-200 leading-relaxed">
                                        {report.aiSummary}
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-zinc-400">
                                    <Loader2 className="w-6 h-6 animate-spin mb-2" />
                                    <span className="text-xs">Generating summary...</span>
                                </div>
                            )}
                        </div>

                        {report.aiFlags && report.aiFlags.length > 0 && (
                            <div>
                                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-500" /> Critical Findings
                                </h3>
                                <div className="space-y-2">
                                    {report.aiFlags.map((flag, idx) => (
                                        <div key={idx} className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/50 rounded text-xs text-amber-900 dark:text-amber-200">
                                            <span className="mt-0.5">•</span>
                                            <span>{flag}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
