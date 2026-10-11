import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { api, setAuthToken, setUnauthorizedHandler } from '@/api/client';
import type { User } from '@/api/types';
import { secureStorage } from '@/utils/storage';

interface AuthValue {
  user: User | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: { name: string; email: string; password: string; currency: string }) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (patch: Partial<Pick<User, 'name' | 'currency' | 'theme'>>) => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);
const TOKEN_KEY = 'auth-token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const signOut = useCallback(async () => {
    setAuthToken(null);
    setUser(null);
    await secureStorage.remove(TOKEN_KEY);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      signOut();
    });
    (async () => {
      try {
        const token = await secureStorage.get(TOKEN_KEY);
        if (token) {
          setAuthToken(token);
          const { user: me } = await api.get<{ user: User }>('/auth/me');
          setUser(me);
        }
      } catch {
        // Offline or token expired: show sign-in; the token is cleared by the 401 handler if invalid.
      } finally {
        setReady(true);
      }
    })();
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  const finishAuth = useCallback(async ({ token, user: u }: { token: string; user: User }) => {
    setAuthToken(token);
    await secureStorage.set(TOKEN_KEY, token);
    setUser(u);
  }, []);

  const value = useMemo<AuthValue>(() => ({
    user,
    ready,
    signOut,
    signIn: async (email, password) => finishAuth(await api.post('/auth/login', { email, password })),
    signUp: async (input) => finishAuth(await api.post('/auth/register', input)),
    updateProfile: async (patch) => {
      const { user: updated } = await api.patch<{ user: User }>('/auth/me', patch);
      setUser(updated);
    },
  }), [user, ready, signOut, finishAuth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export function useCurrency() {
  return useAuth().user?.currency ?? 'USD';
}
