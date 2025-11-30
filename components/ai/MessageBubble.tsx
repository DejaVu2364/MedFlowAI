import React from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../../lib/utils';
import { SparklesIcon, UserIcon } from '@heroicons/react/24/outline';

interface MessageBubbleProps {
    role: 'user' | 'ai';
    content: string;
    isTyping?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ role, content, isTyping }) => {
    if (isTyping) {
        return (
            <div className="flex gap-3 mr-auto max-w-[90%] animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="w-8 h-8 rounded-full bg-white border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                    <SparklesIcon className="w-4 h-4" />
                </div>
                <div className="bg-white border border-indigo-100/50 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5 h-12">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        );
    }

    return (
        <div className={cn("flex gap-3 max-w-[95%] animate-in fade-in slide-in-from-bottom-2 duration-300", role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto")}>
            <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm mt-1",
                role === 'user' ? "bg-indigo-600 text-white" : "bg-white border border-indigo-100 text-indigo-600"
            )}>
                {role === 'user' ? (
                    <UserIcon className="w-4 h-4" />
                ) : (
                    <SparklesIcon className="w-4 h-4" />
                )}
            </div>
            <div className={cn(
                "flex flex-col gap-1 w-full p-3.5 rounded-2xl text-sm shadow-sm leading-relaxed",
                role === 'user'
                    ? "bg-indigo-600 text-white rounded-tr-none"
                    : "bg-white text-foreground rounded-tl-none border border-indigo-100/50"
            )}>
                <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                    <ReactMarkdown>
                        {content}
                    </ReactMarkdown>
                </div>
            </div>
        </div>
    );
};
