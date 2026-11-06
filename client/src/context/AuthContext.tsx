'use client';
import {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import {
  errorMessage,
  SESSION_EXPIRED_EVENT,
  TOKEN_KEY,
  tokenStorage,
} from '@/services/api';
import type { Credentials, User } from '@/types/user';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string;
  loginPath: string;
  login: (input: Credentials) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}
export const AuthContext = createContext<AuthState | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessionExpired, setSessionExpired] = useState(false);
  const router = useRouter();
  const sessionVersion = useRef(0);
  const refreshUser = useCallback(async () => {
    const version = ++sessionVersion.current;
    setError('');
    setLoading(true);
    try {
      const profile = tokenStorage.get() ? await authService.me() : null;
      if (version === sessionVersion.current) setUser(profile);
    } catch (err) {
      if (version === sessionVersion.current) {
        setUser(null);
        if (tokenStorage.get()) setError(errorMessage(err));
      }
    } finally {
      if (version === sessionVersion.current) setLoading(false);
    }
  }, []);
  const clearSession = useCallback(
    (expired: boolean) => {
      sessionVersion.current++;
      tokenStorage.clear();
      setSessionExpired(expired);
      setUser(null);
      setLoading(false);
      setError('');
      router.replace(expired ? '/login?expired=1' : '/login');
    },
    [router],
  );
  useEffect(() => {
    void refreshUser();
    const expired = () => clearSession(true);
    const storage = (event: StorageEvent) => {
      if (event.key === TOKEN_KEY || event.key === null) void refreshUser();
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, expired);
    window.addEventListener('storage', storage);
    return () => {
      sessionVersion.current++;
      window.removeEventListener(SESSION_EXPIRED_EVENT, expired);
      window.removeEventListener('storage', storage);
    };
  }, [clearSession, refreshUser]);
  const login = async (input: Credentials) => {
    const session = await authService.login(input);
    sessionVersion.current++;
    tokenStorage.set(session.token);
    setSessionExpired(false);
    setUser(session.user);
    setLoading(false);
    setError('');
  };
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        loginPath: sessionExpired ? '/login?expired=1' : '/login',
        login,
        logout: () => clearSession(false),
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
