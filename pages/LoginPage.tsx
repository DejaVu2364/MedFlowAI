import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const LoginPage: React.FC = () => {
    const { login, signup } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email.trim()) {
            setError('Email is required.');
            return;
        }
        if (!password.trim()) {
            setError('Password is required.');
            return;
        }

        setIsLoading(true);

        try {
            if (isLogin) {
                await login(email, password);
                // Only navigate on success
                navigate(from, { replace: true });
            } else {
                await signup(email, password);
                navigate(from, { replace: true });
            }
        } catch (err: any) {
            console.error("Login error:", err);
            let msg = "Failed to sign in.";
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
                msg = "Invalid email or password.";
            } else if (err.code === 'auth/email-already-in-use') {
                msg = "Email already in use.";
            } else if (err.code === 'auth/weak-password') {
                msg = "Password should be at least 6 characters.";
            } else if (err.message) {
                msg = err.message;
            }
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <Card className="w-full max-w-md shadow-lg border-border/50">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold text-primary">MedFlow AI</CardTitle>
                    <CardDescription>
                        {isLogin ? 'Sign in to your account' : 'Create a new account'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                                data-testid="login-email-input"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                                data-testid="login-password-input"
                                required
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
                                <ExclamationTriangleIcon className="h-4 w-4" />
                                <span>{error}</span>
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading}
                            data-testid="login-submit-button"
                        >
                            {isLoading ? 'Processing...' : (isLogin ? 'Sign in' : 'Create Account')}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4 text-center text-sm text-muted-foreground">
                    <button
                        type="button"
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError('');
                        }}
                        className="text-primary hover:underline focus:outline-none"
                    >
                        {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
                    </button>

                    <div className="text-xs pt-4 border-t w-full">
                        <p className="font-semibold mb-1">Demo Accounts:</p>
                        <p>doctor@medflow.ai / password123</p>
                        <p>intern@medflow.ai / password123</p>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
};

export default LoginPage;