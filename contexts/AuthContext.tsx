import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Role } from '../types';
import { getAuthInstance, getIsFirebaseInitialized } from '../services/firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

interface AuthContextType {
    currentUser: User | null;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    isLoading: boolean;
    error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Mock Credentials (moved from LoginPage)
const MOCK_USER_CREDENTIALS = {
    'doctor@medflow.ai': 'password123',
    'intern@medflow.ai': 'password123',
    'admin@medflow.ai': 'admin123'
};

const MOCK_USERS: Record<string, User> = {
    'doctor@medflow.ai': { id: 'USR-001', name: 'Dr. Sarah Chen', email: 'doctor@medflow.ai', role: 'Doctor' },
    'intern@medflow.ai': { id: 'USR-002', name: 'Dr. James Wu (Intern)', email: 'intern@medflow.ai', role: 'Intern' },
    'admin@medflow.ai': { id: 'USR-003', name: 'Admin User', email: 'admin@medflow.ai', role: 'Admin' }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Helper to map Firebase user to App user
    const mapFirebaseUser = (user: any): User => {
        const role = user.email?.includes('admin') ? 'Admin' : user.email?.includes('intern') ? 'Intern' : 'Doctor';
        return {
            id: user.uid,
            name: user.displayName || user.email?.split('@')[0] || 'User',
            email: user.email || '',
            role: role as Role
        };
    };

    useEffect(() => {
        let mounted = true;

        // Safety timeout to prevent infinite loading
        const safetyTimeout = setTimeout(() => {
            if (mounted && isLoading) {
                console.warn("DEBUG: Auth initialization timed out");
                setIsLoading(false);
                // Don't set error here to avoid blocking UI if it's just slow
            }
        }, 5000);

        const initialize = async () => {
            const auth = getAuthInstance();
            if (getIsFirebaseInitialized() && auth) {
                // Remove multiple listeners by returning unsubscribe
                const unsubscribe = onAuthStateChanged(auth, (user) => {
                    if (!mounted) return;
                    clearTimeout(safetyTimeout);

                    if (user) {
                        const mappedUser = mapFirebaseUser(user);
                        setCurrentUser(mappedUser);
                    } else {
                        setCurrentUser(null);
                    }
                    setIsLoading(false);
                });
                return unsubscribe;
            } else {
                // Fallback to local storage for demo mode
                const storedUser = localStorage.getItem('medflow_user');
                if (storedUser) {
                    try {
                        setCurrentUser(JSON.parse(storedUser));
                    } catch (e) {
                        console.error("Failed to parse stored user", e);
                        localStorage.removeItem('medflow_user');
                    }
                }
                clearTimeout(safetyTimeout);
                setIsLoading(false);
                return () => {};
            }
        };

        const unsubscribePromise = initialize();

        return () => {
            mounted = false;
            clearTimeout(safetyTimeout);
            unsubscribePromise.then(unsub => unsub && unsub());
        };
    }, []); // Empty dependency array, run once

    const login = async (email: string, password: string) => {
        console.log("DEBUG: login called with", email);
        setIsLoading(true);
        setError(null);

        if (getIsFirebaseInitialized()) {
            const auth = getAuthInstance();
            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                // Do NOT set state here if onAuthStateChanged handles it,
                // BUT for fast feedback we can set it optimistically or wait for listener.
                // The listener handles it, but might be async.
                // To avoid race condition where redirect happens before state update:
                // We await the state update effectively by letting the listener trigger.
                // However, listener is async.
                // Better: we rely on the listener for the *initial* load, but for manual login, we can set it.
                // But setting it twice causes re-renders.
                // Let's stick to listener for consistency, but ensure we don't resolve this promise until state is stable?
                // No, simpler: just wait.
            } catch (err: any) {
                console.error("Login failed", err);
                setError(err.message || 'Failed to login');
                setIsLoading(false);
                throw err; // Re-throw so caller knows it failed
            }
        } else {
            // Mock Login
            await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network
            const user = MOCK_USERS[email.toLowerCase()];
            if (user && MOCK_USER_CREDENTIALS[email.toLowerCase() as keyof typeof MOCK_USER_CREDENTIALS] === password) {
                setCurrentUser(user);
                localStorage.setItem('medflow_user', JSON.stringify(user));
            } else {
                const err = new Error('Invalid email or password.');
                setError(err.message);
                setIsLoading(false);
                throw err;
            }
            setIsLoading(false);
        }
    };

    const signup = async (email: string, password: string) => {
        setIsLoading(true);
        setError(null);
        if (getIsFirebaseInitialized()) {
            const auth = getAuthInstance();
            try {
                const { createUserWithEmailAndPassword } = await import('firebase/auth');
                await createUserWithEmailAndPassword(auth, email, password);
                // Listener handles state
            } catch (err: any) {
                console.error("Signup failed", err);
                setError(err.message || 'Failed to create account');
                setIsLoading(false);
                throw err;
            }
        } else {
            const err = new Error("Cannot create account in Demo Mode");
            setError(err.message);
            setIsLoading(false);
            throw err;
        }
    };

    const logout = async () => {
        setIsLoading(true);
        if (getIsFirebaseInitialized()) {
            const auth = getAuthInstance();
            try {
                await signOut(auth);
                setCurrentUser(null);
            } catch (e) { console.error(e); }
        } else {
            setCurrentUser(null);
            localStorage.removeItem('medflow_user');
        }
        setIsLoading(false);
    };

    return (
        <AuthContext.Provider value={{ currentUser, login, signup, logout, isLoading, error }}>
            {children}
        </AuthContext.Provider>
    );
};
