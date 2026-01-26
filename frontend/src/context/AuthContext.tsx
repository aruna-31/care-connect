import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';


interface User {
    id: string;
    email: string;
    role: 'doctor' | 'patient';
    name: string;
}

interface AuthContextType {
    user: User | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            if (token) {
                try {
                    // Verify token with backend
                    const res = await fetch(`${API_URL}/api/v1/auth/me`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (res.ok) {
                        const data = await res.json();
                        setUser(data.user);
                        localStorage.setItem('user', JSON.stringify(data.user)); // Sync fresh data
                    } else {
                        // Token invalid/expired
                        console.warn("Session expired or invalid");
                        logout();
                    }
                } catch (error) {
                    console.error("Auth verification failed", error);
                    // If storedUser exists but network failed, maybe keep it? 
                    // But to be safe on 'invalid token' scenarios, let's trust the error implies issue.
                    // Actually, if network error (offline), we shouldn't logout.
                    // Only logout if 401/403. 
                    // For simplicity in this dev environment, we assume server is up.
                    // If storedUser matches what we had, we rely on it temporarily.
                    if (storedUser) {
                        try {
                            setUser(JSON.parse(storedUser));
                        } catch (e) {
                            console.error("Failed to parse stored user after network error", e);
                            logout(); // Clear if stored user is also corrupt
                        }
                    } else {
                        setUser(null); // No stored user and network error, so no user
                    }
                }
            } else if (storedUser) {
                // No token, but a stored user exists. This is an inconsistent state.
                // Clear it to ensure consistency.
                localStorage.removeItem('user');
                setUser(null);
            } else {
                // No token and no stored user, so user is null.
                setUser(null);
            }
            setIsLoading(false);
        };

        initAuth();
    }, []);

    const login = (token: string, userData: User) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
