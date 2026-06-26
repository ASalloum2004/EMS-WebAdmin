import type { ReactNode } from "react";
import { useAuth } from "../context";

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    window.location.replace("/");
    return null;
  }

  return <>{children}</>;
}
