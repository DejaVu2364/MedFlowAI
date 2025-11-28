import React, { useState, useRef, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Card } from '../ui/card';
import { SparklesIcon, PaperAirplaneIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { usePatient } from '../../contexts/PatientContext';
import { useParams, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface Message {
    role: 'user' | 'ai';
    content: string;
    timestamp: Date;
}

export const AIChatDrawer: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Context awareness
    const { id } = useParams<{ id: string }>(); // Might be undefined if not on patient page
    const { patients } = usePatient();
    const location = useLocation();

    // Find patient if on patient page
    const patientId = id || location.pathname.split('/')[2];
    const patient = patients.find(p => p.id === patientId);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (text: string = input) => {
        if (!text.trim()) return;

        const userMsg: Message = { role: 'user', content: text, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        // Simulate AI Delay & Context Injection
        setTimeout(() => {
            let response = "I can help with that.";
            const contextPrefix = patient ? `[Context: Patient ${patient.name}, ${patient.age}y, ${patient.triage.level} Triage] ` : "[Context: General] ";

            if (text.toLowerCase().includes('summarize')) {
                response = `${contextPrefix}Based on the history, the patient presented with ${patient?.complaint || 'symptoms'}. Vitals are currently stable. Recommended plan includes monitoring and standard care protocol.`;
            } else if (text.toLowerCase().includes('lab') || text.toLowerCase().includes('interpret')) {
                response = `${contextPrefix}Latest labs show normal range for electrolytes. WBC count is slightly elevated, suggesting possible infection response. Continue to monitor.`;
            } else if (text.toLowerCase().includes('change')) {
                response = `${contextPrefix}In the last 24 hours, SpO2 dropped slightly but recovered. BP has been stable. No new acute events recorded.`;
            } else {
                response = `${contextPrefix}I've analyzed the clinical data. Based on current guidelines, consider reviewing the medication list for interactions.`;
            }

            setMessages(prev => [...prev, { role: 'ai', content: response, timestamp: new Date() }]);
            setIsTyping(false);
        }, 1500);
    };

    const prompts = [
        "Summarize patient history",
        "Interpret today's labs",
        "What changed in the last 24h?",
        "Draft discharge summary"
    ];

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button
                    className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl bg-indigo-600 hover:bg-indigo-700 text-white z-50 animate-in zoom-in duration-300"
                    size="icon"
                >
                    <ChatBubbleLeftRightIcon className="w-7 h-7" />
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] flex flex-col h-full border-l border-border shadow-2xl">
                <SheetHeader className="pb-4 border-b border-border">
                    <SheetTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                        <SparklesIcon className="w-5 h-5" />
                        Ask MedFlow AI
                    </SheetTitle>
                    {patient && (
                        <p className="text-xs text-muted-foreground">
                            Context: <span className="font-bold">{patient.name}</span> ({patient.age}y)
                        </p>
                    )}
                </SheetHeader>

                <ScrollArea className="flex-1 pr-4 -mr-4" ref={scrollRef}>
                    <div className="space-y-4 py-4">
                        {messages.length === 0 && (
                            <div className="text-center py-10 text-muted-foreground space-y-2">
                                <SparklesIcon className="w-12 h-12 mx-auto opacity-20" />
                                <p>Ask me anything about the patient's file.</p>
                            </div>
                        )}
                        {messages.map((m, i) => (
                            <div key={i} className={cn("flex gap-3 max-w-[90%]", m.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto")}>
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                                    m.role === 'user' ? "bg-indigo-600 text-white" : "bg-white border border-indigo-100 text-indigo-600"
                                )}>
                                    {m.role === 'user' ? (
                                        <span className="text-xs font-bold">You</span>
                                    ) : (
                                        <SparklesIcon className="w-4 h-4" />
                                    )}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <div className={cn(
                                        "p-3.5 rounded-2xl text-sm shadow-sm leading-relaxed",
                                        m.role === 'user'
                                            ? "bg-indigo-600 text-white rounded-tr-none"
                                            : "bg-white text-foreground rounded-tl-none border border-indigo-100/50"
                                    )}>
                                        {m.content}
                                    </div>
                                    {m.role === 'ai' && (
                                        <Badge variant="outline" className="w-fit text-[10px] text-indigo-600 border-indigo-200 bg-indigo-50/50 px-2 py-0.5 h-5">
                                            AI-generated — verify before signing
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex gap-1 ml-2">
                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <div className="pt-4 mt-auto border-t border-border space-y-4">
                    {/* Quick Prompts */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {prompts.map(p => (
                            <button
                                key={p}
                                onClick={() => handleSend(p)}
                                className="whitespace-nowrap px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 text-xs font-medium border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 transition-colors"
                            >
                                {p}
                            </button>
                        ))}
                    </div>

                    {/* Input Area */}
                    <div className="relative">
                        <Textarea
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Type a clinical question..."
                            className="pr-12 resize-none min-h-[50px] max-h-[120px]"
                        />
                        <Button
                            size="icon"
                            className="absolute right-2 bottom-2 h-8 w-8 bg-indigo-600 hover:bg-indigo-700"
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isTyping}
                        >
                            <PaperAirplaneIcon className="w-4 h-4 text-white" />
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
};
