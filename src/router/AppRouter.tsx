
import LoginPage from "../features/auth/routes/LoginPage";
import { MangementPage } from "../features/mangement";
import ResetPasswordPage from "../features/auth/routes/ResetPasswordPage";
import ProfilePage from "../features/profile/routes/ProfilePage";
import { MangementLayout } from "../layouts";
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

  if (path === "/mangement") {
    return (
      <AuthGuard>
        <MangementLayout>
          <MangementPage />
        </MangementLayout>
      </AuthGuard>
    );
  }

  return <LoginPage />;
}
