import { useEffect, useState } from "react";
import eyeIcon from "../../../../assets/auth/eye.svg";
import eyeOpenIcon from "../../../../assets/auth/eye-open.svg";
import { resetPasswordIcon } from "../../../../assets/Profile";
import { useChangePassword } from "../../hooks";
import "./ChangePasswordModal.scss";

interface ChangePasswordModalProps {
  onClose: () => void;
}

interface PasswordFieldProps {
  autoComplete: string;
  disabled?: boolean;
  error?: string;
  id: string;
  isVisible: boolean;
  label: string;
  name: string;
  onChange: (value: string) => void;
  onToggleVisibility: () => void;
  toggleAriaLabel: string;
  value: string;
}

function PasswordField({
  autoComplete,
  disabled = false,
  error = "",
  id,
  isVisible,
  label,
  name,
  onChange,
  onToggleVisibility,
  toggleAriaLabel,
  value,
}: PasswordFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div className="change-password-modal__field">
      <label className="change-password-modal__label" htmlFor={id}>
        {label}
      </label>

      <div className="change-password-modal__input-wrapper">
        <input
          autoComplete={autoComplete}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={Boolean(error)}
          className={`change-password-modal__input${
            error ? " change-password-modal__input--invalid" : ""
          }`}
          id={id}
          name={name}
          type={isVisible ? "text" : "password"}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        />

        <button
          type="button"
          className="change-password-modal__visibility-button"
          aria-label={toggleAriaLabel}
          aria-pressed={isVisible}
          disabled={disabled}
          onClick={onToggleVisibility}
        >
          <img
            src={isVisible ? eyeOpenIcon : eyeIcon}
            alt=""
            aria-hidden="true"
          />
        </button>
      </div>

      {error ? (
        <p className="change-password-modal__field-error" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

type PasswordVisibilityField =
  | "currentPassword"
  | "newPassword"
  | "confirmNewPassword";

export function ChangePasswordModal({ onClose }: ChangePasswordModalProps) {
  const [visiblePasswords, setVisiblePasswords] = useState<
    Record<PasswordVisibilityField, boolean>
  >({
    currentPassword: false,
    newPassword: false,
    confirmNewPassword: false,
  });
  const {
    confirmNewPassword,
    currentPassword,
    error,
    fieldErrors,
    feedbackMessage,
    isSubmitting,
    newPassword,
    submitChangePassword,
    updateConfirmNewPassword,
    updateCurrentPassword,
    updateNewPassword,
  } = useChangePassword();
  const message = error || feedbackMessage;
  const messageClassName = `change-password-modal__feedback${
    feedbackMessage ? " change-password-modal__feedback--success" : ""
  }`;

  function togglePasswordVisibility(field: PasswordVisibilityField) {
    setVisiblePasswords((currentVisiblePasswords) => ({
      ...currentVisiblePasswords,
      [field]: !currentVisiblePasswords[field],
    }));
  }

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
            disabled={isSubmitting}
            error={fieldErrors.currentPassword}
            id="change-password-current-password"
            isVisible={visiblePasswords.currentPassword}
            label="Current Password"
            name="currentPassword"
            value={currentPassword}
            onChange={updateCurrentPassword}
            onToggleVisibility={() => togglePasswordVisibility("currentPassword")}
            toggleAriaLabel={
              visiblePasswords.currentPassword
                ? "Hide current password"
                : "Show current password"
            }
          />

          <PasswordField
            autoComplete="new-password"
            disabled={isSubmitting}
            error={fieldErrors.newPassword}
            id="change-password-new-password"
            isVisible={visiblePasswords.newPassword}
            label="New Password"
            name="newPassword"
            value={newPassword}
            onChange={updateNewPassword}
            onToggleVisibility={() => togglePasswordVisibility("newPassword")}
            toggleAriaLabel={
              visiblePasswords.newPassword
                ? "Hide new password"
                : "Show new password"
            }
          />

          <PasswordField
            autoComplete="new-password"
            disabled={isSubmitting}
            error={fieldErrors.confirmNewPassword}
            id="change-password-confirm-new-password"
            isVisible={visiblePasswords.confirmNewPassword}
            label="Confirm New Password"
            name="confirmNewPassword"
            value={confirmNewPassword}
            onChange={updateConfirmNewPassword}
            onToggleVisibility={() =>
              togglePasswordVisibility("confirmNewPassword")
            }
            toggleAriaLabel={
              visiblePasswords.confirmNewPassword
                ? "Hide confirm password"
                : "Show confirm password"
            }
          />
        </div>

        {message ? (
          <p
            className={messageClassName}
            aria-live="polite"
            role={error ? "alert" : "status"}
          >
            {message}
          </p>
        ) : null}

        <button
          type="submit"
          className="change-password-modal__button"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}
