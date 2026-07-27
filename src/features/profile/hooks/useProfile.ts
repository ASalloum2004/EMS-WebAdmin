import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../../../context";
import { getProfile, updateProfile as updateProfileRequest } from "../api";
import type { AdminProfile, AdminProfileUpdatePayload } from "../types";
import {
  getProfileErrorMessage,
  useOptionalProfileContext,
} from "./ProfileContext";

const ACCEPTED_AVATAR_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/webp",
]);

interface UseProfileOptions {
  initialProfile?: AdminProfile | null;
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
  const profileContext = useOptionalProfileContext();
  const [localProfile, setLocalProfile] =
    useState<AdminProfile | null>(initialProfile);
  const [localError, setLocalError] = useState("");
  const [localIsLoading, setLocalIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInputValue, setNameInputValue] = useState("");
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState("");
  const [profileActionError, setProfileActionError] = useState("");
  const hasRequestedProfile = useRef(false);
  const avatarPreviewUrlRef = useRef("");
  const avatarUploadIdRef = useRef(0);

  const refreshLocalProfile = useCallback(async () => {
    setLocalError("");
    setLocalIsLoading(true);

    try {
      const nextProfile = await getProfile();
      setLocalProfile(nextProfile);
      return nextProfile;
    } catch (profileError) {
      setLocalError(
        getProfileErrorMessage(profileError, "Unable to load profile."),
      );
      return null;
    } finally {
      setLocalIsLoading(false);
    }
  }, []);

  const error = profileContext?.error ?? localError;
  const isLoading = profileContext?.isLoading ?? localIsLoading;
  const profile = profileContext?.profile ?? localProfile;
  const refreshProfile = profileContext?.refreshProfile ?? refreshLocalProfile;
  const setProfile = profileContext?.setProfile ?? setLocalProfile;

  useEffect(() => {
    if (profileContext) {
      return;
    }

    if (hasRequestedProfile.current) {
      return;
    }

    hasRequestedProfile.current = true;
    void refreshProfile();
  }, [profileContext, refreshProfile]);

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
          getProfileErrorMessage(profileError, "Unable to update profile."),
        );
        return null;
      } finally {
        setIsUpdating(false);
      }
    },
    [setProfile],
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
