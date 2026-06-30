import { LoginPage, ResetPasswordPage } from "../features/auth/pages";
import { ManagementPage } from "../features/management";
import { ProfilePage } from "../features/profile/pages";
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

  return <LoginPage />;
}
