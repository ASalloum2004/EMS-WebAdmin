import { LoginPage, ResetPasswordPage } from "../features/auth/routes";
import { ProfilePage } from "../features/profile/routes";

export function AppRouter() {
  const path = window.location.pathname;

  if (path === "/profile") {
    return <ProfilePage />;
  }

  if (path === "/reset-password") {
    return <ResetPasswordPage />;
  }

  return <LoginPage />;
}