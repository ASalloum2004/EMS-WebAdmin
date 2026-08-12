import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { login } from "../features/auth/api";
import type { AuthSession, AuthUser, LoginCredentials } from "../features/auth/types";
import {
  clearAuthSession,
  getAuthSession,
  setAuthSession,
} from "../features/auth/utils/authStorage";
import { clearProfileSessionCache } from "../features/profile/data/profileCache";

interface AuthContextValue {
  isAuthenticated: boolean;
  session: AuthSession | null;
  signIn: (credentials: LoginCredentials, rememberMe?: boolean) => Promise<void>;
  signOut: () => void;
  user: AuthUser | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(getAuthSession);

  const signIn = useCallback(async (credentials: LoginCredentials, rememberMe: boolean = false) => {
    const nextSession = await login(credentials);
    clearProfileSessionCache();
    setAuthSession(nextSession, rememberMe);
    setSession(nextSession);
  }, []);

  const signOut = useCallback(() => {
    clearProfileSessionCache();
    clearAuthSession();
    setSession(null);
    if (window.location.pathname !== "/") {
      window.location.replace("/");
    }
  }, []);

  useEffect(() => {
    const handleLogout = () => signOut();
    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, [signOut]);

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
