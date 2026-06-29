import type { ReactNode } from "react";
import { AdminLayout } from "../admin/AdminLayout";
import "./ManagementLayout.scss";

interface ManagementLayoutProps {
  children: ReactNode;
}

export function ManagementLayout({ children }: ManagementLayoutProps) {
  return (
    <AdminLayout>
      <section className="management-layout">
        <div className="management-layout__container">{children}</div>
      </section>
    </AdminLayout>
  );
}
