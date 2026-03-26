import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, AUTH_TOKEN_KEY } from "../lib/api";

export type AuthUser = { id: string; name: string; email: string };

type AuthContextValue = {
  user: AuthUser | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        if (!cancelled) setReady(true);
        return;
      }

      try {
        const { data } = await api.get<{ user: AuthUser }>("/auth/me");
        if (!cancelled) setUser(data.user);
      } catch {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<{ token: string; user: AuthUser }>("/auth/login", {
      email,
      password,
    });
    localStorage.setItem(AUTH_TOKEN_KEY, data.token);
    setUser(data.user);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    await api.post<{ token: string; user: AuthUser }>("/auth/register", {
      name,
      email,
      password,
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, ready, login, register, logout }),
    [user, ready, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
