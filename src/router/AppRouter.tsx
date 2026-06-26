import { LoginPage, ResetPasswordPage } from "../features/auth/routes";


export function AppRouter() {
  const path = window.location.pathname;

  
  if (path === "/reset-password") {
    return <ResetPasswordPage />;
  }

  return <LoginPage />;
}