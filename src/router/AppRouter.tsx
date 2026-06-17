import LoginPage from "../features/pages/LoginPage";
import ResetPasswordPage from "../features/pages/ResetPassword";

export function AppRouter() {
  const path = window.location.pathname;

  if (path === "/reset-password") {
    return <ResetPasswordPage />;
  }

  return <LoginPage />;
}