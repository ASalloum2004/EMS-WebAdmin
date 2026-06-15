import { useState } from "react";
import loginHeroImage from "../../../assets/auth/hero-login.png";
import successHeroImage from "../../../assets/auth/hero-success.png";
import { AuthLayout } from "../../../layouts";
import {
  ForgotPasswordModal,
  LoginForm,
  PasswordResetSuccess,
} from "../components";
import "./LoginPage.scss";
import { forgotPassword } from "../api/forgetpasswordApi.ts";
export default function LoginPage() {
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isResetSent, setIsResetSent] = useState(false);
  const heroImageSrc = isResetSent ? successHeroImage : loginHeroImage;
  const overlayVariant = isResetSent ? "dim" : "brand";

  return (
    <>
      <AuthLayout
        brandName="Damascus Fair"
        description="The comprehensive suite for organizers, providing real-time analytics, seamless exhibitor onboarding, and total control."
        heroImageSrc={heroImageSrc}
        overlayVariant={overlayVariant}
        title="Elevate your exhibition management."
      >
        {isResetSent ? (
          <PasswordResetSuccess onBackToLogin={() => setIsResetSent(false)} />
        ) : (
          <LoginForm onForgotPassword={() => setIsForgotPasswordOpen(true)} />
        )}
      </AuthLayout>

      {isForgotPasswordOpen && (
        <ForgotPasswordModal
          onCancel={() => setIsForgotPasswordOpen(false)}
          onProceed={async (email) => {
            console.log("Before forgotPassword API:", email);

            await forgotPassword(email);

            console.log("After forgotPassword API success");
            setIsForgotPasswordOpen(false);
            setIsResetSent(true);
          }}
        />
      )}
    </>
  );
}
