import type { ReactNode } from "react";
import { useAuth } from "../context";
import { ProfileProvider } from "../features/profile/hooks";

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    window.location.replace("/");
    return null;
  }

  return <ProfileProvider>{children}</ProfileProvider>;
}
