import { useState, useEffect } from 'react';
import { getIsFirebaseInitialized, getAuthInstance } from '../services/firebase';

export const useBackendStatus = () => {
    const [isOnline, setIsOnline] = useState<boolean>(false);
    const [latency, setLatency] = useState<number>(0);
    const [lastHeartbeat, setLastHeartbeat] = useState<Date | null>(null);

    useEffect(() => {
        // Initial check
        const isFirebase = getIsFirebaseInitialized();
        setIsOnline(isFirebase); // Assume offline if no firebase config, or online if config present (initially)

        if (!isFirebase) return;

        // Simulate heartbeat or real ping if possible
        // Since we don't have a backend ping endpoint easily accessible without auth potentially,
        // we can check navigator.onLine and Firebase connectivity presence.

        const checkConnection = async () => {
            if (!navigator.onLine) {
                setIsOnline(false);
                return;
            }

            const start = Date.now();
            try {
                // We can't easily ping firebase auth without making a request.
                // We'll simulate latency for the prototype or assume online if navigator is online.
                // For a more robust check, we could try to fetch a public resource or check auth state.
                const auth = getAuthInstance();
                await auth.authStateReady(); // Wait for auth to initialize

                const end = Date.now();
                setLatency(end - start);
                setIsOnline(true);
                setLastHeartbeat(new Date());
            } catch (e) {
                setIsOnline(false);
            }
        };

        const interval = setInterval(checkConnection, 30000); // Check every 30s
        checkConnection();

        return () => clearInterval(interval);
    }, []);

    return { isOnline, latency, lastHeartbeat };
};
