import { useState } from "react";
import { FormField } from "../../../components";
import arrowRightIcon from "../../../assets/auth/arrow-right.svg";
import eyeIcon from "../../../assets/auth/eye.svg";
import eyeOpenIcon from "../../../assets/auth/eye-open.svg";
import lockIcon from "../../../assets/auth/lock.svg";
import mailIcon from "../../../assets/auth/mail.svg";
import shieldIcon from "../../../assets/auth/shield.svg";
import { useLoginForm } from "../hooks";

interface LoginFormProps {
  onForgotPassword: () => void;
}


export default function LoginForm({ onForgotPassword }: LoginFormProps) {
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
        <h2>Admin Login</h2>
        <p>Enter your credentials to access the management suite.</p>
      </div>

      {error && <p className="login-error">{error}</p>}

      <div className="auth-form-fields">
        <FormField
          autoComplete="email"
          iconSrc={mailIcon}
          name="email"
          onChange={(value) => updateField("email", value)}
          placeholder="Email Address"
          type="email"
          value={credentials.email}
        />

        <FormField
          autoComplete="current-password"
          iconSrc={lockIcon}
          name="password"
          onChange={(value) => updateField("password", value)}
          placeholder="Password"
          rightElement={
            <button
              type="button"
              className="password-visibility-button"
              aria-label={showPassword ? "Hide password" : "Show password"}
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
          <span>Remember me</span>
        </label>

        <button
          className="forgot-password-button"
          type="button"
          onClick={onForgotPassword}
        >
          Forgot Password?
        </button>
      </div>

      <button
        type="submit"
        className="login-submit-button"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          "Logging in..."
        ) : (
          <>
            <span>Login</span>
            <img src={arrowRightIcon} alt="" aria-hidden="true" />
          </>
        )}
      </button>

      <div className="secure-notice">
        <img src={shieldIcon} alt="" aria-hidden="true" />
        <span>SECURE AES-256 ENCRYPTION</span>
      </div>
    </form>
  );
}
