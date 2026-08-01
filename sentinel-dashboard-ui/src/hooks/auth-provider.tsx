import { useCallback, useState, type ReactNode } from "react";
import { checkAuth, login, logout } from "@/api/auth";
import type { LoginParams } from "@/api/auth";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
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
      if (res.success) setIsAuthenticated(true);
      return res;
    } catch {
      setIsAuthenticated(false);
      return { success: false, msg: "无法连接到 Dashboard，请检查服务地址和登录信息" };
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

  return <AuthContext.Provider value={{ isAuthenticated, loading, check, signIn, signOut }}>{children}</AuthContext.Provider>;
}
