import adminAvatar from "../../../assets/AdminAppbar/admin-avatar.svg";
import { ProfileLayout } from "../../../layouts";
import { SignOutCard } from "../../auth/components";
import {
  ChangePasswordCard,
  LanguageSettingsCard,
  ProfileIdentityCard,
  ThemeSettingsCard,
} from "../components";

export function ProfilePage() {
  return (
    <ProfileLayout>
      <ProfileIdentityCard
        name="Alex Mercer"
        role="Administrator"
        email="alex.mercer@example.com"
        avatarUrl={adminAvatar}
      />

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
