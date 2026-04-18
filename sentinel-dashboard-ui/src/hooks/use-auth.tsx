import { useCallback, useState, createContext, useContext } from "react";
import { checkAuth, login, logout } from "@/api/auth";
import type { LoginParams } from "@/api/auth";

interface AuthState {
  isAuthenticated: boolean;
  loading: boolean;
  check: () => Promise<boolean>;
  signIn: (params: LoginParams) => Promise<{ success: boolean; msg?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);

  const check = useCallback(async () => {
    try {
      setLoading(true);
      const res = await checkAuth();
      setIsAuthenticated(res.success);
      return res.success;
    } catch {
      setIsAuthenticated(false);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(async (params: LoginParams) => {
    setLoading(true);
    try {
      const res = await login(params);
      if (res.success) {
        setIsAuthenticated(true);
      }
      return res;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await logout();
    } finally {
      setIsAuthenticated(false);
      window.location.hash = "#/login";
    }
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, check, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
