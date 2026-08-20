import { useState } from "react";
import { EmailIcon } from "../../../../assets/icons/orderIcons";
import type { I18nDictionary } from "../../../../i18n";
import "./PaymentReminderButton.scss";

type PaymentReminderButtonProps = {
  error: string;
  isSending: boolean;
  onClearError: () => void;
  onSend: () => Promise<unknown>;
  successMessage: string;
  t: I18nDictionary;
};

export function PaymentReminderButton({
  error,
  isSending,
  onClearError,
  onSend,
  successMessage,
  t,
}: PaymentReminderButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const labels = t.order.paymentReminder;

  const openConfirmation = () => {
    onClearError();
    setIsConfirming(true);
  };

  const closeConfirmation = () => {
    if (!isSending) setIsConfirming(false);
  };

  const confirmSend = async () => {
    const response = await onSend();
    if (response) setIsConfirming(false);
  };

  return (
    <div className="payment-reminder">
      <div className="payment-reminder__control">
        <button
          aria-expanded={isConfirming}
          className="payment-reminder__button"
          disabled={isSending}
          onClick={openConfirmation}
          type="button"
        >
          <EmailIcon aria-hidden="true" size={16} strokeWidth={2} />
          {isSending ? labels.sending : labels.button}
        </button>

        {isConfirming ? (
          <div aria-label={labels.confirmationTitle} className="payment-reminder__confirm" role="dialog">
            <p>{labels.confirmationMessage}</p>
            <div className="payment-reminder__confirm-actions">
              <button disabled={isSending} onClick={closeConfirmation} type="button">
                {labels.cancel}
              </button>
              <button disabled={isSending} onClick={() => void confirmSend()} type="button">
                {isSending ? labels.sending : labels.confirm}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {error ? <p className="payment-reminder__notice payment-reminder__notice--error" role="alert">{error}</p> : null}
      {successMessage ? <p className="payment-reminder__notice payment-reminder__notice--success" role="status">{successMessage}</p> : null}
    </div>
  );
}
