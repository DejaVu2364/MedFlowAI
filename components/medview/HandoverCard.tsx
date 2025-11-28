import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import { cn } from '../../lib/utils';

interface HandoverCardProps {
    initialNote?: string;
    onSave: (note: string) => void;
    className?: string;
}

export const HandoverCard: React.FC<HandoverCardProps> = ({ initialNote = '', onSave, className }) => {
    const [note, setNote] = useState(initialNote);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = () => {
        setIsSaving(true);
        // Simulate save delay
        setTimeout(() => {
            onSave(note);
            setIsSaving(false);
        }, 500);
    };

    return (
        <Card className={cn("", className)}>
            <Accordion type="single" collapsible defaultValue="handover">
                <AccordionItem value="handover" className="border-b-0">
                    <CardHeader className="p-0">
                        <AccordionTrigger className="px-6 py-4 hover:no-underline">
                            <div className="flex items-center gap-2">
                                <ClipboardDocumentCheckIcon className="w-5 h-5 text-primary" />
                                <CardTitle className="text-base font-semibold">Doctor-to-Doctor Handover</CardTitle>
                            </div>
                        </AccordionTrigger>
                    </CardHeader>
                    <AccordionContent className="px-6 pb-6">
                        <div className="space-y-4">
                            <Textarea
                                placeholder="Type handover notes here..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="min-h-[120px] resize-none bg-yellow-50/50 border-yellow-200 focus-visible:ring-yellow-500/20"
                            />
                            <div className="flex justify-end">
                                <Button onClick={handleSave} disabled={isSaving} size="sm">
                                    {isSaving ? 'Saving...' : 'Save Note'}
                                </Button>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </Card>
    );
};
