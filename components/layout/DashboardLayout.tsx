import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import {
    HomeIcon, UsersIcon, CalendarIcon, Cog6ToothIcon,
    ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon,
    BellIcon, UserCircleIcon, Bars3Icon, SunIcon, MoonIcon
} from '@heroicons/react/24/outline';
import { useUI } from '../../contexts/UIContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const SidebarItem: React.FC<{
    icon: React.ElementType;
    label: string;
    path: string;
    active?: boolean;
    collapsed?: boolean;
    onClick: () => void;
}> = ({ icon: Icon, label, path, active, collapsed, onClick }) => (
    <button
        onClick={onClick}
        className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md transition-all w-full text-sm font-medium",
            active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            collapsed && "justify-center px-2"
        )}
        title={collapsed ? label : undefined}
    >
        <Icon className="w-5 h-5 flex-shrink-0" />
        {!collapsed && <span>{label}</span>}
    </button>
);

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    const { currentUser, logout } = useAuth();
    const { theme, toggleTheme } = useUI();
    const navigate = useNavigate();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);

    const menuItems = [
        { icon: HomeIcon, label: 'Dashboard', path: '/' },
        { icon: CalendarIcon, label: 'Schedule', path: '/schedule' },
    ];

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar */}
            <aside
                className={cn(
                    "border-r border-border bg-card transition-all duration-300 flex flex-col sticky top-0 h-screen z-40",
                    collapsed ? "w-16" : "w-64"
                )}
            >
                <div className="h-14 flex items-center px-4 border-b border-border">
                    <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
                            <span className="text-sm">MF</span>
                        </div>
                        {!collapsed && <span>MedFlow AI</span>}
                    </div>
                </div>

                <div className="flex-1 py-4 px-3 space-y-1">
                    {menuItems.map((item) => (
                        <SidebarItem
                            key={item.path}
                            icon={item.icon}
                            label={item.label}
                            path={item.path}
                            active={location.pathname === item.path || (item.path === '/' && location.pathname.startsWith('/patient'))}
                            collapsed={collapsed}
                            onClick={() => navigate(item.path)}
                        />
                    ))}
                </div>

                <div className="p-3 border-t border-border">
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="flex items-center justify-center w-full p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors"
                    >
                        {collapsed ? <ChevronRightIcon className="w-4 h-4" /> : <ChevronLeftIcon className="w-4 h-4" />}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30 px-6 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                        <Button variant="ghost" size="icon" className="md:hidden">
                            <Bars3Icon className="w-5 h-5" />
                        </Button>
                        <div className="hidden md:flex items-center text-sm text-muted-foreground">
                            <span className="hover:text-foreground cursor-pointer" onClick={() => navigate('/')}>Home</span>
                            <ChevronRightIcon className="w-4 h-4 mx-2" />
                            <span className="font-medium text-foreground">Patient Detail</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative hidden sm:block">
                            <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search patients... (Cmd+K)"
                                className="w-64 pl-9 h-9 bg-muted/50 border-transparent focus:bg-background focus:border-input transition-all"
                            />
                            <div className="absolute right-2 top-2 text-[10px] font-mono text-muted-foreground border rounded px-1.5 bg-background">⌘K</div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={toggleTheme} title="Toggle Theme">
                            {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="relative">
                            <BellIcon className="w-5 h-5" />
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-background"></span>
                        </Button>
                        <Separator orientation="vertical" className="h-6" />
                        <div className="flex items-center gap-2">
                            <div className="text-right hidden sm:block">
                                <div className="text-sm font-medium leading-none">{currentUser?.name || 'Dr. Smith'}</div>
                                <div className="text-xs text-muted-foreground">{currentUser?.role || 'Chief Resident'}</div>
                            </div>
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <UserCircleIcon className="w-8 h-8 text-muted-foreground" />
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};
