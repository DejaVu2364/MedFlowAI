

import React, { useContext } from 'react';
import { AppContext } from '../App';
import { AppContextType } from '../types';
import { UserCircleIcon, ClipboardDocumentListIcon, HomeIcon, ChatBubbleLeftRightIcon, SunIcon, MoonIcon } from './icons';

interface HeaderProps {
    onToggleChat: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleChat }) => {
    const { currentUser, page, setPage, selectedPatientId, theme, toggleTheme } = useContext(AppContext) as AppContextType;

    // Triage button should only be enabled if a patient is selected from the dashboard first.
    // This logic is now handled by the triage buttons on the patient cards.
    // The nav button can act as a shortcut if a patient is already selected.
    const isTriageDisabled = page !== 'triage' && !selectedPatientId;

    const navItems = [
        { name: 'Dashboard', page: 'dashboard', icon: <HomeIcon /> },
        { name: 'Reception', page: 'reception', icon: <ClipboardDocumentListIcon /> },
        // { name: 'Triage', page: 'triage', icon: <BeakerIcon />, disabled: isTriageDisabled },
    ];

    return (
        <header className="bg-background-primary shadow-md dark:border-b dark:border-border-color">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-4">
                        <h1 className="text-2xl font-bold text-brand-blue-dark">
                            MedFlow AI
                        </h1>
                        <nav className="hidden md:flex space-x-2">
                            {navItems.map(item => (
                                <button
                                    key={item.name}
                                    onClick={() => setPage(item.page as any)}
                                    disabled={(item as any).disabled}
                                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                        page === item.page
                                            ? 'bg-brand-blue-light text-brand-blue-dark'
                                            : 'text-text-secondary hover:bg-background-tertiary'
                                    } disabled:text-text-tertiary disabled:bg-transparent disabled:cursor-not-allowed`}
                                >
                                    {item.icon}
                                    <span className="ml-2">{item.name}</span>
                                </button>
                            ))}
                        </nav>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-4">
                         <button
                            onClick={onToggleChat}
                            className="p-2 rounded-full text-text-secondary hover:bg-background-tertiary hover:text-brand-blue-dark transition-colors"
                            aria-label="Toggle AI Chat"
                        >
                            <ChatBubbleLeftRightIcon />
                        </button>
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full text-text-secondary hover:bg-background-tertiary transition-colors"
                            aria-label="Toggle theme"
                        >
                            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
                        </button>
                        <div className="flex items-center">
                            <UserCircleIcon />
                            <span className="ml-2 text-sm font-medium text-text-secondary">{currentUser.name} ({currentUser.role})</span>
                        </div>
                    </div>
                </div>
            </div>
             {/* Mobile Navigation */}
            <nav className="md:hidden bg-background-secondary border-t border-border-color">
                <div className="flex justify-around">
                    {navItems.map(item => (
                        <button
                            key={item.name}
                            onClick={() => setPage(item.page as any)}
                            disabled={(item as any).disabled}
                            className={`flex flex-col items-center justify-center w-full py-2 text-xs font-medium transition-colors ${
                                page === item.page
                                    ? 'text-brand-blue-dark'
                                    : 'text-text-secondary hover:bg-background-tertiary'
                            } disabled:text-text-tertiary disabled:bg-transparent`}
                        >
                            {item.icon}
                            <span>{item.name}</span>
                        </button>
                    ))}
                </div>
            </nav>
        </header>
    );
};

export default Header;