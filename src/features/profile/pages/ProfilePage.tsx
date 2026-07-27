import { ProfileLayout } from "../../../layouts";
import { useI18n } from "../../../i18n";
import { SignOutCard } from "../../auth/components";
import {
  ChangePasswordCard,
  LanguageSettingsCard,
  ProfileIdentityCard,
  ProfileIdentitySkeleton,
  ThemeSettingsCard,
} from "../components";
import { useProfile } from "../hooks";
import "./ProfilePage.scss";

export function ProfilePage() {
  return (
    <ProfileLayout>
      <ProfilePageContent />
    </ProfileLayout>
  );
}

function ProfilePageContent() {
  const { t } = useI18n();
  const {
    avatarUrl,
    cancelNameEdit,
    changeNameInput,
    email,
    error,
    feedbackMessage,
    isLoading,
    isEditingName,
    isUpdating,
    name,
    nameInputValue,
    role,
    refreshProfile,
    saveName,
    startNameEdit,
    uploadAvatar,
  } = useProfile();

  return (
    <>
      {isLoading ? (
        <ProfileIdentitySkeleton />
      ) : error ? (
        <section
          aria-live="polite"
          className="profile-page__load-error"
          role="alert"
        >
          <p>{error}</p>
          <button type="button" onClick={() => void refreshProfile()}>
            {t.common.tryAgain}
          </button>
        </section>
      ) : (
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
      )}

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
