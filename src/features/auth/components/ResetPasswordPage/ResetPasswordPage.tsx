import { useState } from "react";
import successHeroImage from "../../../../assets/auth/hero-success.png";
import { AuthLayout } from "../../../../layouts";
import { FormField } from "../../../../components";
import lockIcon from "../../../../assets/auth/lock.svg";
import eyeIcon from "../../../../assets/auth/eye.svg";
import eyeOpenIcon from "../../../../assets/auth/eye-open.svg";
import arrowRightIcon from "../../../../assets/auth/arrow-right.svg";
import { useResetPasswordForm } from "../../hooks";
import "./ResetPasswordPage.scss";

export function ResetPasswordPage() {
  const {
    password,
    confirmPassword,
    error,
    isSubmitting,
    handleSubmit,
    updatePassword,
    updateConfirmPassword,
  } = useResetPasswordForm();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <AuthLayout
      brandName="Damascus Fair"
      description="The comprehensive suite for organizers, providing real-time analytics, seamless exhibitor onboarding, and total control."
      heroImageSrc={successHeroImage}
      overlayVariant="brand"
      title="Elevate your exhibition management."
    >
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-card-header">
          <h2>Set New Password</h2>
          <p>Please enter and confirm your new password.</p>
        </div>

        {error && <p className="login-error">{error}</p>}

        <div className="auth-form-fields">
          <FormField
            autoComplete="new-password"
            iconSrc={lockIcon}
            name="password"
            onChange={updatePassword}
            placeholder="New password"
            rightElement={
              <button
                type="button"
                className="password-visibility-button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((current) => !current)}
              >
                <img
                  src={showPassword ? eyeOpenIcon : eyeIcon}
                  alt=""
                  aria-hidden="true"
                />
              </button>
            }
            type={showPassword ? "text" : "password"}
            value={password}
          />

          <FormField
            autoComplete="new-password"
            iconSrc={lockIcon}
            name="confirmPassword"
            onChange={updateConfirmPassword}
            placeholder="Confirm password"
            rightElement={
              <button
                type="button"
                className="password-visibility-button"
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
                onClick={() => setShowConfirmPassword((current) => !current)}
              >
                <img
                  src={showConfirmPassword ? eyeOpenIcon : eyeIcon}
                  alt=""
                  aria-hidden="true"
                />
              </button>
            }
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
          />
        </div>

        <button
          className="login-submit-button"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            "Saving..."
          ) : (
            <>
              <span>Save New Password</span>
              <img src={arrowRightIcon} alt="" aria-hidden="true" />
            </>
          )}
        </button>

        <button
          type="button"
          className="back-to-login-button reset-password-back-link"
          onClick={() => {
            window.location.href = "/";
          }}
        >
          <span aria-hidden="true">←</span>
          <span>Back to Login</span>
        </button>
      </form>
    </AuthLayout>
  );
}