import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';
import {
    ChevronRightIcon,
    ChevronLeftIcon,
    Bars3Icon,
    MagnifyingGlassIcon,
    SunIcon,
    MoonIcon,
    BellIcon,
    UserCircleIcon,
    HomeIcon,
    ClipboardDocumentCheckIcon,
    UsersIcon
} from '@heroicons/react/24/outline';
import Header from '../Header';

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
            "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 w-full group",
            active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            collapsed && "justify-center px-2"
        )}
        title={collapsed ? label : undefined}
    >
        <Icon className={cn("w-5 h-5 flex-shrink-0 transition-colors", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
        {!collapsed && <span>{label}</span>}
        {!collapsed && active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
    </button>
);

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    const { currentUser } = useAuth();
    const { theme, toggleTheme } = useUI();
    const [collapsed, setCollapsed] = React.useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { label: 'Reception', path: '/', icon: HomeIcon },
        { label: 'Triage', path: '/triage', icon: ClipboardDocumentCheckIcon },
        { label: 'Consultant', path: '/consultant', icon: UsersIcon },
    ];

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed left-0 top-16 bottom-0 bg-card border-r border-border transition-all duration-300 z-30 hidden md:flex flex-col shadow-[1px_0_5px_rgba(0,0,0,0.02)]",
                    collapsed ? "w-16" : "w-64"
                )}
            >
                <div className="flex-1 py-6 px-3 space-y-1">
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

                <div className="p-3 border-t border-border bg-muted/10">
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="flex items-center justify-center w-full p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors"
                        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {collapsed ? <ChevronRightIcon className="w-4 h-4" /> : <ChevronLeftIcon className="w-4 h-4" />}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={cn(
                "flex-1 flex flex-col min-w-0 transition-all duration-300 bg-muted/5",
                !collapsed ? "md:pl-64" : "md:pl-16"
            )}>
                <Header onToggleChat={() => { }} />

                {/* Page Content */}
                <div className="flex-1 overflow-auto p-6">
                    {children}
                </div>
            </main>
        </div>
    );
};
