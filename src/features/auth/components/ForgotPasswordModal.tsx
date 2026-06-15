import { useState } from "react";
import type { FormEvent } from "react";
import { FormField } from "../../../components";
import mailIcon from "../../../assets/auth/mail.svg";
import { isBlank } from "../../../utils";

interface ForgotPasswordModalProps {
  onCancel: () => void;
  onProceed: (email: string) => Promise<void> | void;
}

export function ForgotPasswordModal({
  onCancel,
  onProceed,
}: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isBlank(email)) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setError("");
      setIsSubmitting(true);

      await onProceed(email.trim());
    } catch {
      setError("Unable to send reset request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="forgot-modal-backdrop">
      <form
        aria-labelledby="forgot-password-title"
        className="forgot-modal-card"
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
      >
        <div className="forgot-modal-header">
          <h3 id="forgot-password-title">Forgot your password?</h3>
          <p>Would you like to proceed with the password reset process?</p>
        </div>

        {error && <p className="login-error">{error}</p>}

        <FormField
          autoComplete="email"
          iconSrc={mailIcon}
          name="resetEmail"
          onChange={(value) => {
            setEmail(value);
            if (error) setError("");
          }}
          placeholder="type your email here to reset the password"
          type="email"
          value={email}
        />

        <div className="forgot-modal-actions">
          <button
            className="forgot-confirm-button"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Sending..." : "Yes, proceed"}
          </button>

          <button
            className="forgot-cancel-button"
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}