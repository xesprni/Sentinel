import { useCallback, useState } from "react";
import { checkAuth, login, logout } from "@/api/auth";
import type { LoginParams } from "@/api/auth";

export function useAuth() {
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

  return { isAuthenticated, loading, check, signIn, signOut };
}
