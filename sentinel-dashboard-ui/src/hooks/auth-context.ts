import { createContext } from "react";
import type { LoginParams } from "@/api/auth";

export interface AuthState {
  isAuthenticated: boolean;
  loading: boolean;
  check: () => Promise<boolean>;
  signIn: (params: LoginParams) => Promise<{ success: boolean; msg?: string }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthState | null>(null);
