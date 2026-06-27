import { useCallback, useState } from "react";
import { getProfile } from "../api";
import type { AdminProfile } from "../types";

interface UseProfileOptions {
  initialProfile?: AdminProfile | null;
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error.message : fallbackMessage;
}

export function useProfile({ initialProfile = null }: UseProfileOptions = {}) {
  const [profile, setProfile] = useState<AdminProfile | null>(initialProfile);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const refreshProfile = useCallback(async () => {
    setError("");
    setIsLoading(true);

    try {
      const nextProfile = await getProfile();
      setProfile(nextProfile);
      return nextProfile;
    } catch (profileError) {
      setError(getErrorMessage(profileError, "Unable to load profile."));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    error,
    isLoading,
    profile,
    refreshProfile,
  };
}
