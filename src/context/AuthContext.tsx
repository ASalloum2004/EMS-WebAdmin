import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { login } from "../features/auth/api";
import type { AuthSession, AuthUser, LoginCredentials } from "../types";

interface AuthContextValue {
  isAuthenticated: boolean;
  session: AuthSession | null;
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signOut: () => void;
  user: AuthUser | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);

  const signIn = useCallback(async (credentials: LoginCredentials) => {
    const nextSession = await login(credentials);
    setSession(nextSession);
  }, []);

  const signOut = useCallback(() => {
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(session),
      session,
      signIn,
      signOut,
      user: session?.user ?? null,
    }),
    [session, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
