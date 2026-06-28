import { useCallback, useState } from "react";
import { ApiRequestError } from "../../../api";
import { getProfile, updateProfile as updateProfileRequest } from "../api";
import type { AdminProfile, AdminProfileUpdatePayload } from "../types";

interface UseProfileOptions {
  initialProfile?: AdminProfile | null;
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
  const validationMessage =
    error instanceof ApiRequestError
      ? getValidationErrorMessage(error.errors)
      : "";

  if (validationMessage) {
    return validationMessage;
  }

  return error instanceof Error ? error.message : fallbackMessage;
}

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

export function useProfile({ initialProfile = null }: UseProfileOptions = {}) {
  const [profile, setProfile] = useState<AdminProfile | null>(initialProfile);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");

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

  const updateProfile = useCallback(
    async (payload: AdminProfileUpdatePayload) => {
      setUpdateError("");
      setIsUpdating(true);

      try {
        const nextProfile = await updateProfileRequest(payload);
        setProfile(nextProfile);
        return nextProfile;
      } catch (profileError) {
        setUpdateError(
          getErrorMessage(profileError, "Unable to update profile."),
        );
        return null;
      } finally {
        setIsUpdating(false);
      }
    },
    [],
  );

  return {
    error,
    isLoading,
    isUpdating,
    profile,
    refreshProfile,
    updateError,
    updateProfile,
  };
}
