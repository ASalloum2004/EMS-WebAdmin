import { LoginPage, ResetPasswordPage } from "../features/auth/pages";
import { AnnouncementsPage } from "../features/announcements";
import { CompanyPage } from "../features/company";
import { ManagementPage } from "../features/management";
import { OrderPage } from "../features/order";
import { ProfilePage } from "../features/profile/pages";
import { VisitorPage } from "../features/visitor";
import { AuthGuard } from "./AuthGuard";

export function AppRouter() {
  const path = window.location.pathname;

  if (path === "/reset-password") {
    return <ResetPasswordPage />;
  }

  if (path === "/profile") {
    return (
      <AuthGuard>
        <ProfilePage />
      </AuthGuard>
    );
  }

  if (path === "/management") {
    return (
      <AuthGuard>
        <ManagementPage />
      </AuthGuard>
    );
  }

  if (path === "/companies") {
    return (
      <AuthGuard>
        <CompanyPage />
      </AuthGuard>
    );
  }

  if (path === "/orders") {
    return (
      <AuthGuard>
        <OrderPage />
      </AuthGuard>
    );
  }

  if (path === "/visitors") {
    return (
      <AuthGuard>
        <VisitorPage />
      </AuthGuard>
    );
  }

  if (path === "/announcements") {
    return (
      <AuthGuard>
        <AnnouncementsPage />
      </AuthGuard>
    );
  }

  return <LoginPage />;
}
