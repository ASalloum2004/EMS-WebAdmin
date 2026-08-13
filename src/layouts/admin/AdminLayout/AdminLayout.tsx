import { createContext, useContext, type ReactNode } from "react";
import { useOptionalProfileContext } from "../../../features/profile/hooks";
import type { AdminProfile } from "../../../features/profile/types";
import { AdminAppbar } from "../AdminAppbar";
import { AdminSidebar } from "../AdminSidebar";
import "./AdminLayout.scss";

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayoutContext = createContext(false);

function getAdminDisplayName(profile: AdminProfile | null) {
  const name = profile?.name.trim();

  if (name) {
    return name;
  }

  const email = profile?.email.trim();
  return email || "Admin";
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const isInsideAdminLayout = useContext(AdminLayoutContext);

  if (isInsideAdminLayout) {
    return <>{children}</>;
  }

  return <AdminLayoutShell>{children}</AdminLayoutShell>;
}

function AdminLayoutShell({ children }: AdminLayoutProps) {
  const profile = useOptionalProfileContext()?.profile ?? null;
  const adminName = getAdminDisplayName(profile);
  const adminAvatarUrl = profile?.avatar || undefined;

  return (
    <AdminLayoutContext.Provider value>
      <div className="admin-layout">
        <AdminSidebar adminName={adminName} />

        <div className="admin-layout__body">
          <AdminAppbar adminAvatarUrl={adminAvatarUrl} adminName={adminName} />

          <main className="admin-layout__main">{children}</main>
        </div>
      </div>
    </AdminLayoutContext.Provider>
  );
}
