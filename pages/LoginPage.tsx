
import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import { AppContextType, User } from '../types';
import { findUserByEmail, MOCK_USER_CREDENTIALS } from '../services/api';

const LoginPage: React.FC = () => {
    const { setUser, setPage } = useContext(AppContext) as AppContextType;
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        const user = findUserByEmail(email);

        // In a real app, you would not have client-side password checks.
        // This is a simulation.
        if (user && MOCK_USER_CREDENTIALS[email.toLowerCase() as keyof typeof MOCK_USER_CREDENTIALS] === password) {
            setUser(user);
            setPage('dashboard');
        } else {
            setError('Invalid email or password.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="w-full max-w-md p-8 space-y-6 bg-background-primary rounded-xl shadow-lg">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-brand-blue-dark">Welcome to MedFlow AI</h1>
                    <p className="mt-2 text-text-secondary">Sign in to your account</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-text-secondary">
                            Email address
                        </label>
                        <div className="mt-1">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none block w-full px-3 py-2 border border-border-color rounded-md shadow-sm placeholder-text-tertiary focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm bg-background-primary text-input-text"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password"  className="block text-sm font-medium text-text-secondary">
                            Password
                        </label>
                        <div className="mt-1">
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none block w-full px-3 py-2 border border-border-color rounded-md shadow-sm placeholder-text-tertiary focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm bg-background-primary text-input-text"
                            />
                        </div>
                    </div>
                    
                    {error && <p className="text-sm text-red-600">{error}</p>}

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-blue hover:bg-brand-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue"
                        >
                            Sign in
                        </button>
                    </div>
                </form>
                 <div className="text-center text-xs text-text-tertiary">
                    <p>Demo accounts:</p>
                    <p>doctor@medflow.ai / password123</p>
                    <p>intern@medflow.ai / password123</p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;