import { useEffect, useState, type ReactNode } from "react";
import { LoginPage, ResetPasswordPage } from "../features/auth/pages";
import { AnnouncementsPage } from "../features/announcements";
import { CompanyPage } from "../features/company";
import { ManagementPage } from "../features/management";
import { NotificationsPage } from "../features/notifications";
import { OrderPage } from "../features/order";
import { ProfilePage } from "../features/profile/pages";
import { ReportsPage } from "../features/reports";
import { VisitorPage } from "../features/visitor";
import { VolunteerPage } from "../features/volunteer";
import { AdminLayout } from "../layouts";
import { AuthGuard } from "./AuthGuard";

const adminRoutes: Record<string, ReactNode> = {
  "/announcements": <AnnouncementsPage />,
  "/companies": <CompanyPage />,
  "/management": <ManagementPage />,
  "/notifications": <NotificationsPage />,
  "/orders": <OrderPage />,
  "/profile": <ProfilePage />,
  "/reports": <ReportsPage />,
  "/visitors": <VisitorPage />,
  "/volunteers": <VolunteerPage />,
};

export function AppRouter() {
  const [path, setPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const updatePath = () => setPath(window.location.pathname);

    window.addEventListener("popstate", updatePath);
    return () => window.removeEventListener("popstate", updatePath);
  }, []);

  if (path === "/reset-password") {
    return <ResetPasswordPage />;
  }

  const adminPage = adminRoutes[path];

  if (adminPage) {
    return (
      <AuthGuard>
        <AdminLayout>{adminPage}</AdminLayout>
      </AuthGuard>
    );
  }

  return <LoginPage />;
}

