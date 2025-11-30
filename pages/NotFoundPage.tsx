import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const NotFoundPage: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
            <div className="text-center space-y-6 max-w-md">
                <div className="flex justify-center">
                    <div className="h-24 w-24 rounded-full bg-destructive/10 flex items-center justify-center">
                        <ExclamationTriangleIcon className="h-12 w-12 text-destructive" />
                    </div>
                </div>
                <h1 className="text-4xl font-bold tracking-tight">404 - Page Not Found</h1>
                <p className="text-muted-foreground text-lg">
                    Oops! The page you are looking for does not exist or has been moved.
                </p>
                <div className="pt-4">
                    <Button asChild size="lg">
                        <Link to="/">Go to Dashboard</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;
