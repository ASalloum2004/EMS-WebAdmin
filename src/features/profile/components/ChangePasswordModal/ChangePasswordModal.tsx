import { useEffect } from "react";
import { resetPasswordIcon } from "../../../../assets/Profile";
import { useChangePassword } from "../../hooks";
import "./ChangePasswordModal.scss";

interface ChangePasswordModalProps {
  onClose: () => void;
}

interface PasswordFieldProps {
  autoComplete: string;
  id: string;
  label: string;
  name: string;
  onChange: (value: string) => void;
  value: string;
}

function PasswordField({
  autoComplete,
  id,
  label,
  name,
  onChange,
  value,
}: PasswordFieldProps) {
  return (
    <div className="change-password-modal__field">
      <label className="change-password-modal__label" htmlFor={id}>
        {label}
      </label>

      <input
        autoComplete={autoComplete}
        className="change-password-modal__input"
        id={id}
        name={name}
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

export function ChangePasswordModal({ onClose }: ChangePasswordModalProps) {
  const {
    confirmNewPassword,
    currentPassword,
    error,
    feedbackMessage,
    newPassword,
    submitChangePassword,
    updateConfirmNewPassword,
    updateCurrentPassword,
    updateNewPassword,
  } = useChangePassword();
  const message = error || feedbackMessage;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="change-password-modal"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <form
        aria-labelledby="change-password-modal-title"
        className="change-password-modal__dialog"
        noValidate
        role="dialog"
        aria-modal="true"
        onSubmit={submitChangePassword}
      >
        <button
          type="button"
          className="change-password-modal__close"
          aria-label="Close change password modal"
          onClick={onClose}
        >
          x
        </button>

        <div className="change-password-modal__header">
          <span className="change-password-modal__icon-container">
            <img
              className="change-password-modal__icon"
              src={resetPasswordIcon}
              alt=""
              aria-hidden="true"
            />
          </span>

          <h2 id="change-password-modal-title">Change Password</h2>
        </div>

        <div className="change-password-modal__fields">
          <PasswordField
            autoComplete="current-password"
            id="change-password-current-password"
            label="Current Password"
            name="currentPassword"
            value={currentPassword}
            onChange={updateCurrentPassword}
          />

          <PasswordField
            autoComplete="new-password"
            id="change-password-new-password"
            label="New Password"
            name="newPassword"
            value={newPassword}
            onChange={updateNewPassword}
          />

          <PasswordField
            autoComplete="new-password"
            id="change-password-confirm-new-password"
            label="Confirm New Password"
            name="confirmNewPassword"
            value={confirmNewPassword}
            onChange={updateConfirmNewPassword}
          />
        </div>

        {message ? (
          <p
            className="change-password-modal__feedback"
            aria-live="polite"
            role={error ? "alert" : "status"}
          >
            {message}
          </p>
        ) : null}

        <button type="submit" className="change-password-modal__button">
          Update Password
        </button>
      </form>
    </div>
  );
}
