import type { ReactNode } from "react";
import { AdminLayout } from "../admin/AdminLayout";
import "./ProfileLayout.scss";

interface ProfileLayoutProps {
  children: ReactNode;
}

export function ProfileLayout({ children }: ProfileLayoutProps) {
  return (
    <AdminLayout>
      <section className="profile-layout">
        <div className="profile-layout__container">{children}</div>
      </section>
    </AdminLayout>
  );
}