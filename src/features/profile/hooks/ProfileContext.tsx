import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { ApiRequestError } from "../../../api";
import { useI18n } from "../../../i18n";
import { getProfile } from "../api";
import { applyStoredProfileAvatarRevision } from "../data";
import type { AdminProfile } from "../types";

interface ProfileContextValue {
  error: string;
  isLoading: boolean;
  profile: AdminProfile | null;
  refreshProfile: () => Promise<AdminProfile | null>;
  setProfile: (profile: AdminProfile | null) => void;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(
  undefined,
);

function getValidationErrorMessage(errors: Record<string, unknown> = {}) {
  return ["name", "avatar"]
    .flatMap((field) => getFieldMessages(errors[field]))
    .join(" ");
}

function getFieldMessages(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter(isNonEmptyString);
  }

  return isNonEmptyString(value) ? [value] : [];
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && Boolean(value.trim());
}

export function getProfileErrorMessage(
  error: unknown,
  fallbackMessage: string,
) {
  const validationMessage =
    error instanceof ApiRequestError
      ? getValidationErrorMessage(error.errors)
      : "";

  if (validationMessage) {
    return validationMessage;
  }

  return error instanceof Error ? error.message : fallbackMessage;
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const hasRequestedProfile = useRef(false);

  const refreshProfile = useCallback(async () => {
    setError("");
    setIsLoading(true);

    try {
      const nextProfile = applyStoredProfileAvatarRevision(
        await getProfile(),
      );
      setProfile(nextProfile);
      return nextProfile;
    } catch (profileError) {
      setError(getProfileErrorMessage(profileError, t.profile.loadError));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [t.profile.loadError]);

  useEffect(() => {
    if (hasRequestedProfile.current) {
      return;
    }

    hasRequestedProfile.current = true;
    void refreshProfile();
  }, [refreshProfile]);

  const value = useMemo<ProfileContextValue>(
    () => ({
      error,
      isLoading,
      profile,
      refreshProfile,
      setProfile,
    }),
    [error, isLoading, profile, refreshProfile],
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfileContext() {
  const context = useContext(ProfileContext);

  if (!context) {
    throw new Error("useProfileContext must be used within ProfileProvider");
  }

  return context;
}

export function useOptionalProfileContext() {
  return useContext(ProfileContext);
}
