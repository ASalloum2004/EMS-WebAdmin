import { ProfileLayout } from "../../../layouts";
import { SignOutCard } from "../../auth/components";
import {
  ChangePasswordCard,
  LanguageSettingsCard,
  ProfileIdentityCard,
  ThemeSettingsCard,
} from "../components";
import { useProfile } from "../hooks";

export function ProfilePage() {
  return (
    <ProfileLayout>
      <ProfilePageContent />
    </ProfileLayout>
  );
}

function ProfilePageContent() {
  const {
    avatarUrl,
    cancelNameEdit,
    changeNameInput,
    email,
    error,
    feedbackMessage,
    isEditingName,
    isUpdating,
    name,
    nameInputValue,
    role,
    saveName,
    startNameEdit,
    uploadAvatar,
  } = useProfile();

  return (
    <>
      <ProfileIdentityCard
        name={name}
        role={role}
        email={email}
        avatarUrl={avatarUrl}
        feedbackMessage={feedbackMessage}
        isEditingName={isEditingName}
        isUpdating={isUpdating}
        nameInputValue={nameInputValue}
        onAvatarFileSelect={uploadAvatar}
        onCancelNameEdit={cancelNameEdit}
        onEditName={startNameEdit}
        onNameInputChange={changeNameInput}
        onSaveName={saveName}
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
    </>
  );
}
