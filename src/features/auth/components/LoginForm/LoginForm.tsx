import { useState } from "react";
import { FormField } from "../../../../components";
import { useI18n } from "../../../../i18n";
import arrowRightIcon from "../../../../assets/auth/arrow-right.svg";
import eyeIcon from "../../../../assets/auth/eye.svg";
import eyeOpenIcon from "../../../../assets/auth/eye-open.svg";
import lockIcon from "../../../../assets/auth/lock.svg";
import mailIcon from "../../../../assets/auth/mail.svg";
import shieldIcon from "../../../../assets/auth/shield.svg";
import { useLoginForm } from "../../hooks";
import "./LoginForm.scss";

interface LoginFormProps {
  onForgotPassword: () => void;
}

export function LoginForm({ onForgotPassword }: LoginFormProps) {
  const { t } = useI18n();
  const [showPassword, setShowPassword] = useState(false);
  const {
    credentials,
    error,
    handleSubmit,
    isSubmitting,
    rememberMe,
    toggleRememberMe,
    updateField,
  } = useLoginForm();

  return (
    <form className="login-card" onSubmit={handleSubmit}>
      <div className="login-card-header">
        <h2>{t.auth.adminLogin}</h2>
        <p>{t.auth.loginDescription}</p>
      </div>

      {error && <p className="login-error">{error}</p>}

      <div className="auth-form-fields">
        <FormField
          autoComplete="email"
          iconSrc={mailIcon}
          name="email"
          onChange={(value) => updateField("email", value)}
          placeholder={t.auth.email}
          type="email"
          value={credentials.email}
        />

        <FormField
          autoComplete="current-password"
          iconSrc={lockIcon}
          name="password"
          onChange={(value) => updateField("password", value)}
          rightElement={
            <button
              type="button"
              className="password-visibility-button"
              aria-label={
                showPassword ? t.auth.hidePassword : t.auth.showPassword
              }
              onClick={() => setShowPassword((currentValue) => !currentValue)}
            >
              <img
                src={showPassword ? eyeOpenIcon : eyeIcon}
                alt=""
                aria-hidden="true"
              />
            </button>
          }
          type={showPassword ? "text" : "password"}
          placeholder={t.auth.password}
          value={credentials.password}
        />
      </div>

      <div className="login-actions">
        <label className="remember-control">
          <input
            checked={rememberMe}
            onChange={toggleRememberMe}
            type="checkbox"
          />
          <span>{t.auth.rememberMe}</span>
        </label>

        <button
          className="forgot-password-button"
          type="button"
          onClick={onForgotPassword}
        >
          {t.auth.forgotPassword}
        </button>
      </div>

      <button
        type="submit"
        className="login-submit-button"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          t.auth.loggingIn
        ) : (
          <>
            <span>{t.auth.login}</span>
            <img src={arrowRightIcon} alt="" aria-hidden="true" />
          </>
        )}
      </button>

      <div className="secure-notice">
        <img src={shieldIcon} alt="" aria-hidden="true" />
        <span>{t.auth.secureNotice}</span>
      </div>
    </form>
  );
}
