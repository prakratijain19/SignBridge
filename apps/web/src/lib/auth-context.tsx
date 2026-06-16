'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { AuthUser } from '@signbridge/shared-types';
import {
  API_URL,
  loginRequest,
  logoutRequest,
  meRequest,
  refreshRequest,
  registerRequest,
  type LoginPayload,
  type RegisterPayload,
} from './auth-api';

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  /** True while the initial silent-refresh attempt is in flight. */
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  /** fetch wrapper that attaches the Bearer token and retries once on 401. */
  authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mirror the token in a ref so authFetch always reads the latest value
  // without being re-created on every token change.
  const tokenRef = useRef<string | null>(null);
  const setToken = useCallback((token: string | null) => {
    tokenRef.current = token;
    setAccessToken(token);
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const result = await loginRequest(payload);
      setUser(result.user);
      setToken(result.accessToken);
    },
    [setToken],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const result = await registerRequest(payload);
      setUser(result.user);
      setToken(result.accessToken);
    },
    [setToken],
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      setUser(null);
      setToken(null);
    }
  }, [setToken]);

  const authFetch = useCallback(
    async (input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> => {
      const withAuth = (token: string | null): RequestInit => ({
        ...init,
        credentials: 'include',
        headers: {
          ...(init.headers ?? {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      let res = await fetch(input, withAuth(tokenRef.current));
      if (res.status !== 401) return res;

      // Try a single refresh-then-retry on 401.
      try {
        const { accessToken: next } = await refreshRequest();
        setToken(next);
        res = await fetch(input, withAuth(next));
      } catch {
        setUser(null);
        setToken(null);
      }
      return res;
    },
    [setToken],
  );

  // On mount, attempt a silent refresh to rehydrate the session after reload.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { accessToken: token } = await refreshRequest();
        const me = await meRequest(token);
        if (!cancelled) {
          setToken(token);
          setUser(me);
        }
      } catch {
        // No valid session — remain logged out.
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setToken]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, accessToken, isLoading, login, register, logout, authFetch }),
    [user, accessToken, isLoading, login, register, logout, authFetch],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

// Re-export so consumers have the API base if they need it directly.
export { API_URL };
