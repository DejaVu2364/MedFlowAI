
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Edit2, Sparkles, Loader2 } from 'lucide-react';
import { cleanAndStructureClinicalText } from '../../services/geminiService';

interface ClinicalSectionProps {
    title: string;
    content: string;
    sectionKey: string;
    isEditing: boolean;
    onEditStart: () => void;
    onSave: (newContent: string, newInconsistencies?: string[]) => void;
    onCancel: () => void;
}

export const ClinicalSection: React.FC<ClinicalSectionProps> = ({
    title,
    content,
    sectionKey,
    isEditing,
    onEditStart,
    onSave,
    onCancel
}) => {
    const [draftContent, setDraftContent] = useState(content);
    const [isCleaning, setIsCleaning] = useState(false);
    const [pendingInconsistencies, setPendingInconsistencies] = useState<string[]>([]);

    useEffect(() => {
        setDraftContent(content);
        setPendingInconsistencies([]);
    }, [content, isEditing]);

    const handleCleanWithInconsistencies = async () => {
        setIsCleaning(true);
        try {
            const result = await cleanAndStructureClinicalText(draftContent, title);
            setDraftContent(result.clean_text);
            setPendingInconsistencies(result.inconsistencies);
        } catch (e) {
            console.error("AI Clean failed", e);
        } finally {
            setIsCleaning(false);
        }
    };

    const handleSave = () => {
        onSave(draftContent, pendingInconsistencies.length > 0 ? pendingInconsistencies : undefined);
        setPendingInconsistencies([]);
    };

    return (
        <div className="group relative border-l-2 border-transparent hover:border-primary/20 transition-all pl-4 py-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">{title}</h3>
                {!isEditing && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onEditStart}
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 text-xs"
                    >
                        <Edit2 className="w-3 h-3 mr-1.5" />
                        Edit Section
                    </Button>
                )}
            </div>

            {isEditing ? (
                <div className="space-y-3 animate-in fade-in duration-200">
                    <Textarea
                        value={draftContent}
                        onChange={(e) => setDraftContent(e.target.value)}
                        className="min-h-[150px] font-mono text-sm leading-relaxed resize-none"
                        placeholder={`Enter ${title}...`}
                    />
                    <div className="flex items-center justify-between">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCleanWithInconsistencies}
                            disabled={isCleaning || !draftContent.trim()}
                            className="text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                        >
                            {isCleaning ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-2" />}
                            Clean & Structure (AI)
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
                            <Button size="sm" onClick={handleSave}>Save Changes</Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed min-h-[24px]">
                    {content || <span className="text-muted-foreground italic">No information recorded.</span>}
                </div>
            )}

            {!isEditing && content && (
                <div className="absolute bottom-1 right-0 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    Saved
                </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 h-px bg-zinc-100 dark:bg-zinc-800 mt-4" />
        </div>
    );
};
