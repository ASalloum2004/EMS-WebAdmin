import { useState } from "react";
import type { FormEvent } from "react";
import { FormField } from "../../../../components";
import { useI18n } from "../../../../i18n";
import mailIcon from "../../../../assets/auth/mail.svg";
import { isBlank } from "../../../../utils";
import "./ForgotPasswordModal.scss";

interface ForgotPasswordModalProps {
  onCancel: () => void;
  onProceed: (email: string) => Promise<void> | void;
}

export function ForgotPasswordModal({
  onCancel,
  onProceed,
}: ForgotPasswordModalProps) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isBlank(email)) {
      setError(t.auth.emailRequired);
      return;
    }

    try {
      setError("");
      setIsSubmitting(true);

      await onProceed(email.trim());
    } catch {
      setError(t.auth.resetRequestError);
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
          <h3 id="forgot-password-title">{t.auth.forgotTitle}</h3>
          <p>{t.auth.forgotDescription}</p>
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
          placeholder={t.auth.resetEmailPlaceholder}
          type="email"
          value={email}
        />

        <div className="forgot-modal-actions">
          <button
            className="forgot-confirm-button"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? t.auth.sending : t.auth.sendReset}
          </button>

          <button
            className="forgot-cancel-button"
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {t.common.cancel}
          </button>
        </div>
      </form>
    </div>
  );
}
