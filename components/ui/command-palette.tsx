import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatient } from '../../contexts/PatientContext';
import {
    MagnifyingGlassIcon, UserIcon, DocumentTextIcon,
    ClipboardDocumentListIcon, BeakerIcon, ArrowRightOnRectangleIcon,
    HomeIcon, UsersIcon, PlusIcon, ChartBarIcon, ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const navigate = useNavigate();
    const { patients, selectedPatientId } = usePatient();
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                // Toggle logic should be handled by parent prop change, but here we can ensure close
                if (isOpen) onClose();
            }
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Reset query when opened
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    const filteredPatients = useMemo(() => {
        if (!query) return patients.slice(0, 3); // Show recent 3 by default
        const searchTerms = query.toLowerCase().split(' ').filter(t => t.length > 0);
        return patients.filter(p => {
            const searchString = `${p.name} ${p.id} ${p.age} ${p.gender} ${p.status}`.toLowerCase();
            return searchTerms.every(term => searchString.includes(term));
        }).slice(0, 5);
    }, [patients, query]);

    const actions = useMemo(() => {
        const baseActions = [
            { label: 'Go to Dashboard', icon: HomeIcon, action: () => navigate('/'), category: 'Navigation' },
            { label: 'Consultant View', icon: UsersIcon, action: () => navigate('/consultant'), category: 'Navigation' },
            { label: 'Reception / Admit', icon: ClipboardDocumentListIcon, action: () => navigate('/reception'), category: 'Navigation' },
            { label: 'Triage Board', icon: BeakerIcon, action: () => navigate('/triage'), category: 'Navigation' },
        ];

        if (selectedPatientId) {
            baseActions.push(
                { label: 'Open MedView', icon: ChartBarIcon, action: () => navigate(`/patient/${selectedPatientId}/medview`), category: 'Patient Actions' },
                { label: 'Open Clinical File', icon: DocumentTextIcon, action: () => navigate(`/patient/${selectedPatientId}/clinical`), category: 'Patient Actions' },
                { label: 'Start Rounds', icon: ClipboardDocumentCheckIcon, action: () => navigate(`/patient/${selectedPatientId}/rounds`), category: 'Patient Actions' },
                { label: 'Add Vitals', icon: PlusIcon, action: () => navigate(`/patient/${selectedPatientId}/vitals`), category: 'Patient Actions' },
                { label: 'Add Orders', icon: ClipboardDocumentListIcon, action: () => navigate(`/patient/${selectedPatientId}/orders`), category: 'Patient Actions' },
                { label: 'Add Clinical Note', icon: DocumentTextIcon, action: () => navigate(`/patient/${selectedPatientId}/clinical`), category: 'Patient Actions' },
                { label: 'Discharge Summary', icon: ArrowRightOnRectangleIcon, action: () => navigate(`/patient/${selectedPatientId}/discharge`), category: 'Patient Actions' }
            );
        }

        if (!query) return baseActions;
        return baseActions.filter(a => a.label.toLowerCase().includes(query.toLowerCase()));
    }, [navigate, query, selectedPatientId]);

    const allOptions = [
        ...filteredPatients.map(p => ({ type: 'patient', data: p })),
        ...actions.map(a => ({ type: 'action', data: a }))
    ];

    const handleSelect = (index: number) => {
        const option = allOptions[index];
        if (!option) return;

        if (option.type === 'patient') {
            // @ts-ignore
            navigate(`/patient/${option.data.id}`);
        } else {
            // @ts-ignore
            option.data.action();
        }
        onClose();
    };

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;
        const handleNav = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(i => Math.min(i + 1, allOptions.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(i => Math.max(i - 1, 0));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                handleSelect(selectedIndex);
            }
        };
        window.addEventListener('keydown', handleNav);
        return () => window.removeEventListener('keydown', handleNav);
    }, [isOpen, selectedIndex, allOptions]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="relative w-full max-w-2xl bg-popover rounded-xl shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[70vh]">
                <div className="flex items-center border-b border-border px-4 py-3 gap-3">
                    <MagnifyingGlassIcon className="w-5 h-5 text-muted-foreground shrink-0" />
                    <Input
                        className="flex-1 bg-transparent border-none focus-visible:ring-0 text-lg placeholder:text-muted-foreground text-foreground h-10 shadow-none px-0"
                        placeholder="Search patients, actions, or pages..."
                        value={query}
                        onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
                        autoFocus
                        data-testid="command-palette-input"
                    />
                    <div className="flex gap-2 shrink-0">
                        <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                            <span className="text-xs">⌘</span>K
                        </kbd>
                        <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                            ESC
                        </kbd>
                    </div>
                </div>

                <div className="overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                    {allOptions.length === 0 ? (
                        <div className="py-12 text-center text-sm text-muted-foreground">
                            No results found for "{query}"
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredPatients.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-semibold text-muted-foreground px-2 mb-2 uppercase tracking-wider sticky top-0 bg-popover z-10 py-1">Patients</h3>
                                    <div className="space-y-1">
                                        {filteredPatients.map((p, i) => {
                                            const isSelected = i === selectedIndex;
                                            return (
                                                <button
                                                    key={p.id}
                                                    onClick={() => handleSelect(i)}
                                                    className={cn(
                                                        "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors text-left group",
                                                        isSelected ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-accent/50"
                                                    )}
                                                >
                                                    <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0", isSelected ? "bg-background text-foreground" : "bg-muted text-muted-foreground")}>
                                                        {p.name.charAt(0)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium flex items-center gap-2">
                                                            <span className="truncate">{p.name}</span>
                                                            <Badge variant="outline" className="text-[10px] h-4 px-1 shrink-0">{p.id.slice(-4)}</Badge>
                                                        </div>
                                                        <div className="text-xs text-muted-foreground truncate">
                                                            {p.age}y • {p.gender} • {p.status}
                                                        </div>
                                                    </div>
                                                    {isSelected && <ArrowRightOnRectangleIcon className="w-4 h-4 text-muted-foreground shrink-0" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {actions.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-semibold text-muted-foreground px-2 mb-2 uppercase tracking-wider sticky top-0 bg-popover z-10 py-1">Actions</h3>
                                    <div className="space-y-1">
                                        {actions.map((a, i) => {
                                            const globalIndex = filteredPatients.length + i;
                                            const isSelected = globalIndex === selectedIndex;
                                            return (
                                                <button
                                                    key={a.label}
                                                    onClick={() => handleSelect(globalIndex)}
                                                    className={cn(
                                                        "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors text-left",
                                                        isSelected ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-accent/50"
                                                    )}
                                                >
                                                    <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", isSelected ? "bg-background" : "bg-muted")}>
                                                        <a.icon className="w-4 h-4" />
                                                    </div>
                                                    <span className="font-medium flex-1">{a.label}</span>
                                                    {/* @ts-ignore */}
                                                    {a.category && <span className="ml-auto text-xs text-muted-foreground opacity-50 shrink-0">{a.category}</span>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="border-t border-border p-2 bg-muted/30 text-[10px] text-muted-foreground flex justify-between px-4">
                    <span>Use arrows to navigate, Enter to select</span>
                    <span>MedFlow AI v1.0</span>
                </div>
            </div>
        </div>
    );
};
