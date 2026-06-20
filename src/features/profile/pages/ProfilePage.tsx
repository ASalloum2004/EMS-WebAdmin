import adminAvatar from "../../../assets/AdminAppbar/admin-avatar.svg";
import { ProfileLayout } from "../../../layouts";
import {
  ChangePasswordCard,
  LanguageSettingsCard,
  ProfileIdentityCard,
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
        <LanguageSettingsCard />
        <ChangePasswordCard />
      </div>
    </ProfileLayout>
  );
}