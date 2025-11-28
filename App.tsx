import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UIProvider } from './contexts/UIContext';
import { PatientProvider } from './contexts/PatientContext';
import DashboardPage from './pages/DashboardPage';
import ConsultantViewPage from './pages/ConsultantViewPage';
import ReceptionPage from './pages/ReceptionPage';
import TriagePage from './pages/TriagePage';
import PatientDetailPage from './pages/PatientDetailPage';
import DischargeSummaryPage from './pages/DischargeSummaryPage';
import DischargePrintView from './pages/DischargePrintView';
import LoginPage from './pages/LoginPage';
import Header from './components/Header';
import ChatPanel from './components/ChatPanel';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './contexts/ToastContext';

import { DashboardLayout } from './components/layout/DashboardLayout';
import { CommandPalette } from './components/ui/command-palette';
import { AIChatDrawer } from './components/ai/AIChatDrawer';

const ProtectedLayout: React.FC = () => {
    const { currentUser, isLoading } = useAuth();
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isCmdOpen, setIsCmdOpen] = useState(false);

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsCmdOpen((open) => !open);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen bg-background"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
    }

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    return (
        <DashboardLayout>
            <div className="p-6 max-w-[1600px] mx-auto">
                <Outlet />
            </div>
            <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
            <CommandPalette isOpen={isCmdOpen} onClose={() => setIsCmdOpen(false)} />
            <AIChatDrawer />
        </DashboardLayout>
    );
};

const AppRoutes: React.FC = () => {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/consultant" element={<ConsultantViewPage />} />
                <Route path="/reception" element={<ReceptionPage />} />
                <Route path="/triage" element={<TriagePage />} />
                <Route path="/patient/:id" element={<PatientDetailPage />} />
                <Route path="/discharge/:id" element={<DischargeSummaryPage />} />
                <Route path="/patient/:id/discharge/print" element={<DischargePrintView />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

const App: React.FC = () => {
    useEffect(() => {
        console.log("MedFlow AI v1.0.2 - Vitals Page Added - " + new Date().toISOString());
    }, []);
    return (
        <Router>
            {/* Version: 1.0.1 - Force Update */}
            <ErrorBoundary>
                <ToastProvider>
                    <UIProvider>
                        <AuthProvider>
                            <PatientProvider>
                                <AppRoutes />
                            </PatientProvider>
                        </AuthProvider>
                    </UIProvider>
                </ToastProvider>
            </ErrorBoundary>
        </Router>
    );
};

export default App;