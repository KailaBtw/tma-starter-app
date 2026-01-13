import {
    createContext,
    useContext,
    useState,
    useEffect,
    type ReactNode,
} from 'react';
import { getApiUrl } from '../utils/api';
import type { User } from '../types/api';

interface AuthContextValue {
    isAuthenticated: boolean;
    userInfo: User | null;
    loading: boolean;
    login: (token: string) => Promise<void>;
    logout: () => void;
    checkAuthentication: () => Promise<void>;
    hasRole: (role: string) => boolean;
    hasAnyRole: (roles: string[]) => boolean;
    API_URL: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// API URL with /api prefix
const API_URL = getApiUrl();

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userInfo, setUserInfo] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Check authentication status
    async function checkAuthentication() {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            setIsAuthenticated(false);
            setUserInfo(null);
            setLoading(false);
            return;
        }

        try {
            const headers: Record<string, string> = {
                Authorization: `Bearer ${token}`,
            };

            const response = await fetch(`${API_URL}/auth/me`, {
                headers,
            });

            if (response.ok) {
                const user = (await response.json()) as User;
                setIsAuthenticated(true);
                setUserInfo(user);
            } else {
                // Check if we got an authentication error
                // Error data is available for debugging if needed
                // const errorData = (await response.json().catch(() => ({}))) as {
                //     detail?: string;
                // };
                // const errorMessage = errorData.detail || response.statusText;

                localStorage.removeItem('auth_token');
                localStorage.removeItem('token_type');
                setIsAuthenticated(false);
                setUserInfo(null);

                // Redirect to login if not already there
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }
        } catch (error) {
            console.error('Error checking authentication:', error);
            // Network errors (backend not running) shouldn't clear auth state
            // if we have a token - user might just need to start the backend
            if (
                error instanceof Error &&
                error.message.includes('Failed to fetch')
            ) {
                // Backend is likely not running - keep current auth state
                // but still set loading to false so UI can render
                console.warn(
                    'Backend server appears to be unavailable. Please ensure the backend is running.'
                );
            } else {
                // Other errors - clear auth state
                setIsAuthenticated(false);
                setUserInfo(null);
            }
        } finally {
            setLoading(false);
        }
    }

    // Check auth on mount
    useEffect(() => {
        checkAuthentication();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function login(token: string) {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('token_type', 'bearer');
        // Immediately set authenticated to true to prevent redirect loops
        // checkAuthentication will verify and update userInfo
        setIsAuthenticated(true);
        await checkAuthentication();
    }

    function logout() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('token_type');
        setIsAuthenticated(false);
        setUserInfo(null);
    }

    const value: AuthContextValue = {
        isAuthenticated,
        userInfo,
        loading,
        login,
        logout,
        checkAuthentication,
        hasRole: (role: string) => {
            if (!userInfo || !userInfo.role) return false;
            return userInfo.role.name === role;
        },
        hasAnyRole: (roles: string[]) => {
            if (!userInfo || !userInfo.role) return false;
            return roles.includes(userInfo.role.name);
        },
        API_URL,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
