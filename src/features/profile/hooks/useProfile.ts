import { useCallback, useEffect, useRef, useState } from "react";
import { ApiRequestError } from "../../../api";
import { useAuth } from "../../../context";
import { getProfile, updateProfile as updateProfileRequest } from "../api";
import type { AdminProfile, AdminProfileUpdatePayload } from "../types";

const ACCEPTED_AVATAR_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/webp",
]);

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

function canLoadAvatarUrl(avatarUrl: string) {
  return new Promise<boolean>((resolve) => {
    const image = new Image();

    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);
    image.src = avatarUrl;
  });
}

export function useProfile({ initialProfile = null }: UseProfileOptions = {}) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<AdminProfile | null>(initialProfile);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInputValue, setNameInputValue] = useState("");
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState("");
  const [profileActionError, setProfileActionError] = useState("");
  const hasRequestedProfile = useRef(false);
  const avatarPreviewUrlRef = useRef("");
  const avatarUploadIdRef = useRef(0);

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

  useEffect(() => {
    if (hasRequestedProfile.current) {
      return;
    }

    hasRequestedProfile.current = true;
    void refreshProfile();
  }, [refreshProfile]);

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

  const displayName = profile?.name ?? user?.name ?? "Admin Profile";
  const displayRole =
    profile?.type ?? user?.role ?? (isLoading ? "Loading" : "Admin");
  const displayEmail = profile?.email ?? user?.email ?? "";
  const displayAvatarUrl = profile?.avatar ? profile.avatar : undefined;
  const avatarUrl = avatarPreviewUrl || displayAvatarUrl;
  const feedbackMessage = profileActionError || updateError;

  const clearAvatarPreview = useCallback(() => {
    if (avatarPreviewUrlRef.current) {
      URL.revokeObjectURL(avatarPreviewUrlRef.current);
      avatarPreviewUrlRef.current = "";
    }

    setAvatarPreviewUrl("");
  }, []);

  const setNextAvatarPreview = useCallback(
    (previewUrl: string) => {
      clearAvatarPreview();
      avatarPreviewUrlRef.current = previewUrl;
      setAvatarPreviewUrl(previewUrl);
    },
    [clearAvatarPreview],
  );

  useEffect(() => {
    if (!isEditingName) {
      setNameInputValue(displayName);
    }
  }, [displayName, isEditingName]);

  useEffect(
    () => () => {
      if (avatarPreviewUrlRef.current) {
        URL.revokeObjectURL(avatarPreviewUrlRef.current);
        avatarPreviewUrlRef.current = "";
      }
    },
    [],
  );

  function startNameEdit() {
    setNameInputValue(displayName);
    setProfileActionError("");
    setIsEditingName(true);
  }

  function cancelNameEdit() {
    setNameInputValue(displayName);
    setProfileActionError("");
    setIsEditingName(false);
  }

  async function saveName() {
    const nextName = nameInputValue.trim();

    if (!nextName) {
      setProfileActionError("Name is required.");
      return;
    }

    setProfileActionError("");

    const updatedProfile = await updateProfile({
      name: nextName,
    });

    if (updatedProfile) {
      setNameInputValue(updatedProfile.name);
      setIsEditingName(false);
    }
  }

  async function uploadAvatar(file: File | null) {
    if (!file) {
      return;
    }

    if (!ACCEPTED_AVATAR_TYPES.has(file.type)) {
      setProfileActionError("Please select a JPEG, PNG, JPG, or WebP image.");
      return;
    }

    setProfileActionError("");
    const currentUploadId = avatarUploadIdRef.current + 1;
    avatarUploadIdRef.current = currentUploadId;

    const nextAvatarPreviewUrl = URL.createObjectURL(file);
    setNextAvatarPreview(nextAvatarPreviewUrl);

    const updatedProfile = await updateProfile({
      name: displayName,
      avatar: file,
    });

    if (avatarUploadIdRef.current !== currentUploadId) {
      return;
    }

    if (!updatedProfile) {
      clearAvatarPreview();
      return;
    }

    if (!updatedProfile.avatar) {
      setProfileActionError(
        "Profile photo was uploaded, but the server did not return a displayable image URL. Showing your selected photo for this session.",
      );
      return;
    }

    const canLoadBackendAvatar = await canLoadAvatarUrl(updatedProfile.avatar);

    if (avatarUploadIdRef.current !== currentUploadId) {
      return;
    }

    if (canLoadBackendAvatar) {
      clearAvatarPreview();
      return;
    }

    setProfileActionError(
      "Profile photo was uploaded, but the saved image URL could not be loaded. Showing your selected photo for this session.",
    );
  }

  return {
    avatarUrl,
    cancelNameEdit,
    changeNameInput: setNameInputValue,
    email: displayEmail,
    error,
    feedbackMessage,
    isEditingName,
    isLoading,
    isUpdating,
    name: displayName,
    nameInputValue,
    profile,
    refreshProfile,
    role: displayRole,
    saveName,
    startNameEdit,
    updateError,
    updateProfile,
    uploadAvatar,
  };
}
