import type { ReactNode } from "react";
import { AdminAppbar } from "../AdminAppbar";
import { AdminSidebar } from "../AdminSidebar";
import "./AdminLayout.scss";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="admin-layout">
      <AdminSidebar />

      <div className="admin-layout__body">
        <AdminAppbar />

        <main className="admin-layout__main">{children}</main>
      </div>
    </div>
  );
}