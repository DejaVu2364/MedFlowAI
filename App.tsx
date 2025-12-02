
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UIProvider } from './contexts/UIContext';
import { PatientProvider } from './contexts/PatientContext';
import { ToastProvider } from './contexts/ToastContext';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { CommandPalette } from './components/ui/command-palette';
import { AIChatDrawer } from './components/ai/AIChatDrawer';

// Eager load Discharge Summary to prevent mounting issues
import DischargeSummaryPage from './pages/DischargeSummaryPage';

// Helper to handle chunk load errors (e.g., after deployment)
const lazyLoad = (importFunc: () => Promise<any>) => {
    return React.lazy(() => {
        return importFunc().catch(error => {
            console.error("Chunk load failed", error);
            // Check if we already tried to reload to avoid infinite loop
            const hasReloaded = sessionStorage.getItem('chunk_reload');
            if (!hasReloaded) {
                sessionStorage.setItem('chunk_reload', 'true');
                window.location.reload();
            }
            throw error;
        });
    });
};

// Lazy load pages for performance
const DashboardPage = lazyLoad(() => import('./pages/DashboardPage'));
const ConsultantViewPage = lazyLoad(() => import('./pages/ConsultantViewPage'));
const ReceptionPage = lazyLoad(() => import('./pages/ReceptionPage'));
const TriagePage = lazyLoad(() => import('./pages/TriagePage'));
const PatientDetailPage = lazyLoad(() => import('./pages/PatientDetailPage'));
// DischargeSummaryPage is now eager loaded
const DischargePrintView = lazyLoad(() => import('./pages/DischargePrintView'));
const LoginPage = lazyLoad(() => import('./pages/LoginPage'));
const NotFoundPage = lazyLoad(() => import('./pages/NotFoundPage'));
const BedManagerPage = lazyLoad(() => import('./pages/BedManagerPage').then(module => ({ default: module.BedManagerPage })));

import Header from './components/Header';
import ChatPanel from './components/ChatPanel';
import ErrorBoundary from './components/ErrorBoundary';

const ProtectedLayout: React.FC = () => {
    const { currentUser, isLoading } = useAuth();
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isCmdOpen, setIsCmdOpen] = useState(false);
    const location = useLocation();

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
        return <Navigate to="/login" state={{ from: location }} replace />;
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
        <React.Suspense fallback={
            <div className="flex items-center justify-center h-screen bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground animate-pulse">Loading MedFlow AI...</p>
                </div>
            </div>
        }>
            <Routes>
                <Route path="/login" element={<LoginPage />} />

                <Route element={<ProtectedLayout />}>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/consultant" element={<ConsultantViewPage />} />
                    <Route path="/reception" element={<ReceptionPage />} />
                    <Route path="/triage" element={<TriagePage />} />
                    <Route path="/patient/:id/discharge" element={
                        <React.Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading Discharge Summary...</div>}>
                            <DischargeSummaryPage />
                        </React.Suspense>
                    } />
                    <Route path="/patient/:id/discharge/print" element={<DischargePrintView />} />
                    {/* Updated Patient Detail Route to support tabs */}
                    <Route path="/patient/:id/:tab?" element={<PatientDetailPage />} />
                    <Route path="/bed-manager" element={<BedManagerPage />} />
                </Route>

                <Route path="/404" element={<NotFoundPage />} />
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </React.Suspense>
    );
};

const App: React.FC = () => {
    useEffect(() => {
        console.log("MedFlow AI v1.0.5 - Auto Seed Added - " + new Date().toISOString());

        const firebaseKey = import.meta.env.VITE_FIREBASE_API_KEY;
        const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;

        console.log("DEBUG: Firebase Key present:", !!firebaseKey);
        console.log("DEBUG: Gemini Key present:", !!geminiKey);

        if (!firebaseKey || firebaseKey.includes("YOUR_API_KEY")) {
            console.error("CRITICAL: Firebase API Key is missing or default!");
        }
        if (!geminiKey || geminiKey.includes("YOUR_API_KEY")) {
            console.warn("WARNING: Gemini API Key is missing or default! AI features will fail.");
        }

        // Clear the reload flag on successful load
        sessionStorage.removeItem('chunk_reload');
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