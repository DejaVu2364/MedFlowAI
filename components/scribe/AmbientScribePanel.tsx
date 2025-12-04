import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Loader2, Sparkles, ChevronRight, Check } from 'lucide-react';
import { useUI } from '../../contexts/UIContext';
import { cn, isTestMode } from '../../lib/utils';
import TextareaAutosize from 'react-textarea-autosize';

interface AmbientScribePanelProps {
    patientId: string;
}

export const AmbientScribePanel: React.FC<AmbientScribePanelProps> = ({ patientId }) => {
    // --- TEST MODE OVERRIDE ---
    if (isTestMode) {
        return (
            <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-center">
                <p className="text-zinc-500 text-sm">AI Scribe Disabled in Test Mode</p>
            </div>
        );
    }

    const { updateClinicalFileSection } = useUI();
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [structuredOutput, setStructuredOutput] = useState<any | null>(null);
    const [audioData, setAudioData] = useState<number[]>(new Array(30).fill(10)); // Waveform mock data

    // Simulate audio visualization
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRecording) {
            interval = setInterval(() => {
                setAudioData(prev => prev.map(() => Math.random() * 40 + 10));
            }, 100);
        } else {
            setAudioData(new Array(30).fill(10));
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    const toggleRecording = async () => {
        if (isRecording) {
            setIsRecording(false);
            handleProcessAudio();
        } else {
            setIsRecording(true);
            setTranscript('');
            setStructuredOutput(null);
        }
    };

    const handleProcessAudio = async () => {
        setIsProcessing(true);
        // Simulate API delay for Transcription + Gemini
        await new Promise(resolve => setTimeout(resolve, 2500));

        const mockTranscript = "Patient presents with a 3-day history of productive cough and fever. He mentions the cough is worse at night. He has a history of asthma since childhood. No known drug allergies. On examination, chest is clear with bilateral wheezing.";

        setTranscript(mockTranscript);

        // Mock Gemini Structure
        setStructuredOutput({
            hopi: "Patient reports 3-day history of productive cough associated with fever. Cough exacerbates nocturnally.",
            pmh: "Bronchial Asthma since childhood.",
            systemic: {
                rs: "Bilateral wheezing present. Chest clear otherwise."
            },
            allergies: "NKDA"
        });

        setIsProcessing(false);
    };

    const handleAccept = () => {
        if (!structuredOutput) return;

        // Merge into clinical file
        const updates: any = {};
        if (structuredOutput.hopi) updates['clinicalFile.hopi'] = structuredOutput.hopi;
        if (structuredOutput.pmh) updates['clinicalFile.pmh'] = structuredOutput.pmh;
        if (structuredOutput.systemic?.rs) updates['clinicalFile.systemic.rs'] = structuredOutput.systemic.rs;
        if (structuredOutput.allergies) updates['clinicalFile.allergies'] = structuredOutput.allergies;

        updateClinicalFileSection(patientId, updates);

        // Reset or show success
        setTranscript('');
        setStructuredOutput(null);
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-b border-indigo-100 dark:border-indigo-800 flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" /> Ambient Scribe
                    </h3>
                    <p className="text-xs text-indigo-700 dark:text-indigo-300">
                        Gemini 2.5 Flash Audio Model
                    </p>
                </div>
                {isRecording && (
                    <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                        <span className="text-xs font-mono text-red-600 font-bold">REC 00:04</span>
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6 flex flex-col items-center justify-center space-y-6 overflow-y-auto">

                {/* Visualizer / Initial State */}
                {!transcript && !isProcessing && !structuredOutput && (
                    <div className="w-full flex flex-col items-center gap-4">
                        <div className="h-24 w-full flex items-center justify-center gap-1">
                            {audioData.map((h, i) => (
                                <div
                                    key={i}
                                    className={cn("w-1.5 bg-indigo-500 rounded-full transition-all duration-100", !isRecording && "opacity-20")}
                                    style={{ height: `${h}px` }}
                                />
                            ))}
                        </div>
                        <button
                            onClick={toggleRecording}
                            className={cn(
                                "w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all transform hover:scale-105",
                                isRecording ? "bg-red-500 hover:bg-red-600 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white"
                            )}
                        >
                            {isRecording ? <Square className="w-6 h-6 fill-current" /> : <Mic className="w-8 h-8" />}
                        </button>
                        <p className="text-sm text-zinc-500">
                            {isRecording ? "Listening..." : "Tap to start recording consultation"}
                        </p>
                    </div>
                )}

                {/* Processing State */}
                {isProcessing && (
                    <div className="flex flex-col items-center animate-in fade-in">
                        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                        <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">Transcribing & Structuring...</h4>
                        <p className="text-sm text-zinc-500">Gemini is analyzing clinical entities</p>
                    </div>
                )}

                {/* Review State */}
                {structuredOutput && (
                    <div className="w-full space-y-4 animate-in slide-in-from-bottom-4">
                        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
                            <h4 className="text-xs font-bold text-zinc-500 uppercase mb-2">Transcript</h4>
                            <p className="text-sm text-zinc-700 dark:text-zinc-300 italic">"{transcript}"</p>
                        </div>

                        <div className="space-y-2">
                             <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> Extracted Data
                            </h4>
                            <div className="border border-indigo-100 dark:border-indigo-900 rounded-lg overflow-hidden divide-y divide-indigo-100 dark:divide-indigo-900">
                                {Object.entries(structuredOutput).map(([key, val]) => (
                                    typeof val === 'string' && (
                                        <div key={key} className="flex p-3 bg-white dark:bg-zinc-900">
                                            <div className="w-24 text-xs font-semibold text-zinc-500 uppercase py-1">{key.replace('clinicalFile.', '')}</div>
                                            <div className="flex-1 text-sm text-zinc-800 dark:text-zinc-200 bg-indigo-50/30 dark:bg-indigo-900/10 p-1 rounded">{val}</div>
                                        </div>
                                    )
                                ))}
                                {structuredOutput.systemic && Object.entries(structuredOutput.systemic).map(([key, val]) => (
                                    <div key={`sys-${key}`} className="flex p-3 bg-white dark:bg-zinc-900">
                                         <div className="w-24 text-xs font-semibold text-zinc-500 uppercase py-1">Sys.{key}</div>
                                         <div className="flex-1 text-sm text-zinc-800 dark:text-zinc-200 bg-indigo-50/30 dark:bg-indigo-900/10 p-1 rounded">{val as string}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                onClick={() => {setTranscript(''); setStructuredOutput(null);}}
                                className="px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 rounded-lg"
                            >
                                Discard
                            </button>
                            <button
                                onClick={handleAccept}
                                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm flex items-center gap-2"
                            >
                                <Check className="w-4 h-4" /> Accept & Update File
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
