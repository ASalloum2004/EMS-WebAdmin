import { useEffect, useRef } from "react";
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

export function ProfilePage() {
  const { user } = useAuth();
  const { error, isLoading, profile, refreshProfile } = useProfile();
  const hasRequestedProfile = useRef(false);

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

  return (
    <ProfileLayout>
      <ProfileIdentityCard
        name={displayName}
        role={displayRole}
        email={displayEmail}
        avatarUrl={displayAvatarUrl}
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
