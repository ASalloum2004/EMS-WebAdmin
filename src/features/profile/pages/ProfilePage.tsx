import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../../context";
import { ProfileLayout } from "../../../layouts";
import { SignOutCard } from "../../auth/components";
import {
  ChangePasswordCard,
  LanguageSettingsCard,
  ProfileIdentityCard,
  ThemeSettingsCard,
} from "../components";
import { useProfile } from "../hooks";

const ACCEPTED_AVATAR_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/webp",
]);

export function ProfilePage() {
  const { user } = useAuth();
  const {
    error,
    isLoading,
    isUpdating,
    profile,
    refreshProfile,
    updateError,
    updateProfile,
  } = useProfile();
  const hasRequestedProfile = useRef(false);
  const [draftName, setDraftName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [profileActionError, setProfileActionError] = useState("");

  useEffect(() => {
    if (hasRequestedProfile.current) {
      return;
    }

    hasRequestedProfile.current = true;
    void refreshProfile();
  }, [refreshProfile]);

  const displayName = profile?.name ?? user?.name ?? "Admin Profile";
  const displayRole =
    profile?.type ?? user?.role ?? (isLoading ? "Loading" : "Admin");
  const displayEmail = profile?.email ?? user?.email ?? "";
  const displayAvatarUrl = profile?.avatar ? profile.avatar : undefined;
  const feedbackMessage = profileActionError || updateError;

  useEffect(() => {
    if (!isEditingName) {
      setDraftName(displayName);
    }
  }, [displayName, isEditingName]);

  function handleEditName() {
    setDraftName(displayName);
    setProfileActionError("");
    setIsEditingName(true);
  }

  function handleCancelNameEdit() {
    setDraftName(displayName);
    setProfileActionError("");
    setIsEditingName(false);
  }

  async function handleSaveName() {
    const nextName = draftName.trim();

    if (!nextName) {
      setProfileActionError("Name is required.");
      return;
    }

    setProfileActionError("");

    const updatedProfile = await updateProfile({
      name: nextName,
    });

    if (updatedProfile) {
      setDraftName(updatedProfile.name);
      setIsEditingName(false);
    }
  }

  async function handleAvatarFileSelect(file: File | null) {
    if (!file) {
      return;
    }

    if (!ACCEPTED_AVATAR_TYPES.has(file.type)) {
      setProfileActionError("Please select a JPEG, PNG, JPG, or WebP image.");
      return;
    }

    setProfileActionError("");

    await updateProfile({
      name: displayName,
      avatar: file,
    });
  }

  return (
    <ProfileLayout>
      <ProfileIdentityCard
        name={displayName}
        role={displayRole}
        email={displayEmail}
        avatarUrl={displayAvatarUrl}
        feedbackMessage={feedbackMessage}
        isEditingName={isEditingName}
        isUpdating={isUpdating}
        nameInputValue={draftName}
        onAvatarFileSelect={handleAvatarFileSelect}
        onCancelNameEdit={handleCancelNameEdit}
        onEditName={handleEditName}
        onNameInputChange={setDraftName}
        onSaveName={handleSaveName}
      />

      {error ? (
        <p aria-live="polite" role="alert">
          {error}
        </p>
      ) : null}

      <div className="profile-layout__settings-grid">
        <div className="profile-layout__settings-column">
          <LanguageSettingsCard />
          <SignOutCard />
        </div>

        <div className="profile-layout__settings-column">
          <ChangePasswordCard />
          <ThemeSettingsCard />
        </div>
      </div>
    </ProfileLayout>
  );
}
