import type { ReactNode } from "react";
import {
  ProfileProvider,
  useProfileContext,
} from "../../../features/profile/hooks";
import type { AdminProfile } from "../../../features/profile/types";
import { AdminAppbar } from "../AdminAppbar";
import { AdminSidebar } from "../AdminSidebar";
import "./AdminLayout.scss";

interface AdminLayoutProps {
  children: ReactNode;
}

function getAdminDisplayName(profile: AdminProfile | null) {
  const name = profile?.name.trim();

  if (name) {
    return name;
  }

  const email = profile?.email.trim();
  return email || "Admin";
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <ProfileProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </ProfileProvider>
  );
}

function AdminLayoutContent({ children }: AdminLayoutProps) {
  const { profile } = useProfileContext();
  const adminName = getAdminDisplayName(profile);
  const adminAvatarUrl = profile?.avatar || undefined;

  return (
    <div className="admin-layout">
      <AdminSidebar adminName={adminName} />

      <div className="admin-layout__body">
        <AdminAppbar adminAvatarUrl={adminAvatarUrl} adminName={adminName} />

        <main className="admin-layout__main">{children}</main>
      </div>
    </div>
  );
}
