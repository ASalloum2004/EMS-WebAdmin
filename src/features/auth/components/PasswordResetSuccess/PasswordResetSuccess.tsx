import arrowLeftIcon from "../../../../assets/auth/arrow-left.svg";
import resetSuccessIcon from "../../../../assets/auth/reset-success.svg";
import "./PasswordResetSuccess.scss";

interface PasswordResetSuccessProps {
  onBackToLogin: () => void;
}

export function PasswordResetSuccess({
  onBackToLogin,
}: PasswordResetSuccessProps) {
  return (
    <section className="reset-success-card" aria-labelledby="reset-title">
      <div className="reset-success-icon">
        <img src={resetSuccessIcon} alt="" aria-hidden="true" />
      </div>

      <h2 id="reset-title">Check your inbox</h2>
      <p>
        A password reset link has been sent to your email. Please check your
        inbox to continue.
      </p>

      <button
        className="back-to-login-button"
        type="button"
        onClick={onBackToLogin}
      >
        <img src={arrowLeftIcon} alt="" aria-hidden="true" />
        <span>Back to Login</span>
      </button>
    </section>
  );
}