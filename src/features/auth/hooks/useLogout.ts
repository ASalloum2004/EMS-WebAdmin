import { useState } from "react";
import { ApiRequestError } from "../../../api";
import { useAuth } from "../../../context";
import { logout } from "../api";

export function useLogout() {
  const { session, signOut } = useAuth();
  const [error, setError] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setError("");
    setIsLoggingOut(true);

    if (!session?.token) {
      signOut();
      setIsLoggingOut(false);
      return;
    }

    try {
      await logout();
      signOut();
    } catch (logoutError) {
      if (
        logoutError instanceof ApiRequestError &&
        logoutError.status === 401
      ) {
        signOut();
        return;
      }

      setError("We couldn't sign you out. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  }

  return {
    error,
    handleLogout,
    isLoggingOut,
  };
}
