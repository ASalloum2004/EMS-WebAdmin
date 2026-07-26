import { LoginPage, ResetPasswordPage } from "../features/auth/pages";
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

  return <LoginPage />;
}
