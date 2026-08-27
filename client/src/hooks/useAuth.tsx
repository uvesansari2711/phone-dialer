import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api } from '../services/api';
import {
  AUTH_LOGOUT_EVENT,
  clearAuthSession,
  getAuthToken,
  setAuthSession,
} from '../utils/authStorage';

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  email: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);

  const logout = useCallback(() => {
    clearAuthSession();
    setIsAuthenticated(false);
    setEmail(null);
  }, []);

  const login = useCallback(async (loginEmail: string, password: string) => {
    const response = await api.login(loginEmail, password);
    setAuthSession(response.token, response.email);
    setEmail(response.email);
    setIsAuthenticated(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const token = getAuthToken();

      if (!token) {
        if (!cancelled) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const profile = await api.getMe();
        if (!cancelled) {
          setEmail(profile.email);
          setIsAuthenticated(true);
        }
      } catch {
        clearAuthSession();
        if (!cancelled) {
          setEmail(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleLogout = () => logout();
    window.addEventListener(AUTH_LOGOUT_EVENT, handleLogout);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handleLogout);
  }, [logout]);

  const value = useMemo(
    () => ({
      isAuthenticated,
      isLoading,
      email,
      login,
      logout,
    }),
    [isAuthenticated, isLoading, email, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
