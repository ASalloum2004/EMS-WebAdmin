import type { ReactNode } from "react";
import { AdminLayout } from "../admin/AdminLayout";
import "./MangementLayout.scss";

interface MangementLayoutProps {
  children: ReactNode;
}

export function MangementLayout({ children }: MangementLayoutProps) {
  return (
    <AdminLayout>
      <section className="mangement-layout">
        <div className="mangement-layout__container">{children}</div>
      </section>
    </AdminLayout>
  );
}
