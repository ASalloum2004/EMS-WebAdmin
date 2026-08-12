import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../../../context";
import { useI18n } from "../../../i18n";
import { updateProfile as updateProfileRequest } from "../api";
import {
  applyStoredProfileAvatarRevision,
  applyUploadedProfileAvatarRevision,
  createProfileAvatarRevision,
  getProfileAvatarValidationError,
} from "../data";
import type { AdminProfile, AdminProfileUpdatePayload } from "../types";
import { getProfileErrorMessage, useProfileContext } from "./ProfileContext";

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
  const { t } = useI18n();
  const {
    error,
    isLoading,
    profile: cachedProfile,
    refreshProfile,
    setProfile,
  } = useProfileContext();
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInputValue, setNameInputValue] = useState("");
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState("");
  const [profileActionError, setProfileActionError] = useState("");
  const avatarPreviewUrlRef = useRef("");
  const avatarUploadIdRef = useRef(0);
  const isUpdatingRef = useRef(false);

  const profile = cachedProfile ?? initialProfile;

  const requestProfileUpdate = useCallback(
    async (payload: AdminProfileUpdatePayload) => {
      if (isUpdatingRef.current) {
        return null;
      }

      isUpdatingRef.current = true;
      setUpdateError("");
      setIsUpdating(true);

      try {
        return await updateProfileRequest(payload);
      } catch (profileError) {
        setUpdateError(
          getProfileErrorMessage(profileError, t.profile.updateError),
        );
        return null;
      } finally {
        isUpdatingRef.current = false;
        setIsUpdating(false);
      }
    },
    [t.profile.updateError],
  );

  const updateProfile = useCallback(
    async (payload: AdminProfileUpdatePayload) => {
      const nextProfile = await requestProfileUpdate(payload);

      if (!nextProfile) {
        return null;
      }

      const displayProfile = applyStoredProfileAvatarRevision(nextProfile);
      setProfile(displayProfile);
      return displayProfile;
    },
    [requestProfileUpdate, setProfile],
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
      avatarUploadIdRef.current += 1;

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
      setProfileActionError(t.profile.nameRequired);
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

    const validationError = getProfileAvatarValidationError(file);

    if (validationError) {
      setProfileActionError(t.profile[validationError]);
      return;
    }

    setProfileActionError("");
    const currentUploadId = avatarUploadIdRef.current + 1;
    avatarUploadIdRef.current = currentUploadId;

    const nextAvatarPreviewUrl = URL.createObjectURL(file);
    setNextAvatarPreview(nextAvatarPreviewUrl);

    const previousSavedProfile = profile;
    const updatedProfile = await requestProfileUpdate({
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
      clearAvatarPreview();
      setProfileActionError(
        t.profile.avatarUrlMissing,
      );
      return;
    }

    const displayProfile = applyUploadedProfileAvatarRevision(
      previousSavedProfile,
      updatedProfile,
      createProfileAvatarRevision(),
    );
    setProfile(displayProfile);

    const canLoadBackendAvatar = await canLoadAvatarUrl(
      displayProfile.avatar,
    );

    if (avatarUploadIdRef.current !== currentUploadId) {
      return;
    }

    if (canLoadBackendAvatar) {
      clearAvatarPreview();
      return;
    }

    setProfileActionError(
      t.profile.avatarUrlLoadError,
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
