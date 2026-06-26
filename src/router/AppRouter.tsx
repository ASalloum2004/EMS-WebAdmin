
import LoginPage from "../features/auth/routes/LoginPage";
import ResetPasswordPage from "../features/auth/routes/ResetPasswordPage";
import ProfilePage from "../features/profile/routes/ProfilePage";
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

  return <LoginPage />;
}