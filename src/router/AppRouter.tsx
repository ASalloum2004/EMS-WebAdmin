import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "../context";
import { LoginPage, ResetPasswordPage } from "../features/auth/pages";
import { AnnouncementsPage } from "../features/announcements";
import { CompanyPage } from "../features/company";
import { DashboardPage } from "../features/dashboard";
import { ManagementPage } from "../features/management";
import { NotificationsPage } from "../features/notifications";
import { OrderPage } from "../features/order";
import { ProfilePage } from "../features/profile/pages";
import { ReportsPage } from "../features/reports";
import { VisitorPage } from "../features/visitor";
import { AdminLayout } from "../layouts";
import { AuthGuard } from "./AuthGuard";

const adminRoutes: Record<string, ReactNode> = {
  "/announcements": <AnnouncementsPage />,
  "/companies": <CompanyPage />,
  "/dashboard": <DashboardPage />,
  "/management": <ManagementPage />,
  "/notifications": <NotificationsPage />,
  "/orders": <OrderPage />,
  "/profile": <ProfilePage />,
  "/reports": <ReportsPage />,
  "/visitors": <VisitorPage />,
};

export function AppRouter() {
  const { isAuthenticated } = useAuth();
  const [path, setPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const updatePath = () => setPath(window.location.pathname);

    window.addEventListener("popstate", updatePath);
    return () => window.removeEventListener("popstate", updatePath);
  }, []);

  if (path === "/reset-password") {
    return <ResetPasswordPage />;
  }

  if (path === "/") {
    if (!isAuthenticated) {
      return <LoginPage />;
    }

    window.location.replace("/dashboard");
    return null;
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
