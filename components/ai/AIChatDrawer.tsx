import React, { useState, useRef, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { SparklesIcon, PaperAirplaneIcon, ChatBubbleLeftRightIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { usePatient } from '../../contexts/PatientContext';
import { useParams, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { MessageBubble } from './MessageBubble';
import { retrievePatientContext } from '../../rag/patientRetrieval';
import { chatWithGemini } from '../../services/geminiService';

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
    const { id } = useParams<{ id: string }>();
    const { patients } = usePatient();
    const location = useLocation();

    const patientId = id || location.pathname.split('/')[2];
    const patient = patients.find(p => p.id === patientId);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = async (text: string = input) => {
        if (!text.trim()) return;

        const userMsg: Message = { role: 'user', content: text, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            // RAG Retrieval
            const context = patient ? retrievePatientContext(patient) : "";

            // Gemini API Call
            const responseText = await chatWithGemini(
                [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
                context
            );

            setMessages(prev => [...prev, { role: 'ai', content: responseText, timestamp: new Date() }]);
        } catch (error) {
            console.error("Chat Error:", error);
            setMessages(prev => [...prev, { role: 'ai', content: "I encountered an error. Please try again.", timestamp: new Date() }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleRegenerate = () => {
        if (messages.length > 0 && messages[messages.length - 1].role === 'ai') {
            const lastUserMsg = messages[messages.length - 2];
            if (lastUserMsg && lastUserMsg.role === 'user') {
                setMessages(prev => prev.slice(0, -1)); // Remove last AI response
                handleSend(lastUserMsg.content);
            }
        }
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
                    className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl bg-indigo-600 hover:bg-indigo-700 text-white z-50 animate-in zoom-in duration-300 flex items-center justify-center"
                    size="icon"
                >
                    <ChatBubbleLeftRightIcon className="w-7 h-7" />
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] flex flex-col h-full border-l border-border shadow-2xl bg-background/95 backdrop-blur-sm p-0">
                <SheetHeader className="px-6 py-4 border-b border-border bg-muted/20">
                    <SheetTitle className="flex items-center gap-3 text-indigo-700 dark:text-indigo-400">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                            <SparklesIcon className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="text-base font-bold">MedFlow AI</span>
                            <span className="text-xs font-normal text-muted-foreground">Clinical Co-Pilot</span>
                        </div>
                    </SheetTitle>
                </SheetHeader>

                <ScrollArea className="flex-1 px-6" ref={scrollRef}>
                    <div className="space-y-6 py-6">
                        {/* Patient Snapshot Card */}
                        {patient && (
                            <div className="bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800 rounded-lg p-3 mb-4 text-sm">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-semibold text-indigo-900 dark:text-indigo-100">{patient.name}</div>
                                        <div className="text-xs text-indigo-700 dark:text-indigo-300">{patient.age}y • {patient.gender} • {patient.id}</div>
                                    </div>
                                    <div className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300">
                                        {patient.status}
                                    </div>
                                </div>
                                <div className="mt-2 text-xs text-indigo-800 dark:text-indigo-200">
                                    <span className="font-medium">CC:</span> {patient.chiefComplaints?.[0]?.complaint || 'None'}
                                </div>
                            </div>
                        )}

                        {messages.length === 0 && (
                            <div className="text-center py-10 text-muted-foreground space-y-4">
                                <div className="h-16 w-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto">
                                    <SparklesIcon className="w-8 h-8 text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground">How can I help you?</h3>
                                    <p className="text-sm mt-1">Ask about patient history, labs, or guidelines.</p>
                                </div>
                            </div>
                        )}
                        {messages.map((m, i) => (
                            <MessageBubble key={i} role={m.role} content={m.content} />
                        ))}
                        {isTyping && <MessageBubble role="ai" content="" isTyping={true} />}
                    </div>
                </ScrollArea>

                <div className="p-4 mt-auto border-t border-border bg-background/50 backdrop-blur-md space-y-4">
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
                            placeholder="Ask anything about this patient..."
                            className="pr-12 resize-none min-h-[50px] max-h-[120px] rounded-xl border-black/10 focus-visible:ring-indigo-500"
                        />
                        <div className="absolute right-2 bottom-2 flex gap-1">
                            {messages.length > 0 && !isTyping && (
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                    onClick={handleRegenerate}
                                    title="Regenerate response"
                                >
                                    <ArrowPathIcon className="w-4 h-4" />
                                </Button>
                            )}
                            <Button
                                size="icon"
                                className="h-8 w-8 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all"
                                onClick={() => handleSend()}
                                disabled={!input.trim() || isTyping}
                            >
                                <PaperAirplaneIcon className="w-4 h-4 text-white" />
                            </Button>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
};
