import { useCallback, useState, type FormEvent } from "react";
import { ApiRequestError } from "../../../api";
import { changePassword } from "../api";

const INITIAL_FORM_STATE = {
  currentPassword: "",
  newPassword: "",
  confirmNewPassword: "",
};

type ChangePasswordFormState = typeof INITIAL_FORM_STATE;
type ChangePasswordFieldErrors = Partial<Record<keyof ChangePasswordFormState, string>>;
type ChangePasswordErrorField =
  | "current_password"
  | "new_password"
  | "new_password_confirmation";

const API_ERROR_FIELD_MAP = {
  current_password: "currentPassword",
  new_password: "newPassword",
  new_password_confirmation: "confirmNewPassword",
} satisfies Record<ChangePasswordErrorField, keyof ChangePasswordFormState>;

function validateChangePasswordForm({
  currentPassword,
  newPassword,
  confirmNewPassword,
}: ChangePasswordFormState) {
  const fieldErrors: ChangePasswordFieldErrors = {};

  if (!currentPassword.trim()) {
    fieldErrors.currentPassword = "Current password is required.";
  }

  if (!newPassword.trim()) {
    fieldErrors.newPassword = "New password is required.";
  }

  if (!confirmNewPassword.trim()) {
    fieldErrors.confirmNewPassword = "Please confirm your new password.";
  }

  if (
    newPassword.trim() &&
    confirmNewPassword.trim() &&
    newPassword !== confirmNewPassword
  ) {
    fieldErrors.confirmNewPassword =
      "New password and confirmation do not match.";
  }

  return fieldErrors;
}

function hasFieldErrors(fieldErrors: ChangePasswordFieldErrors) {
  return Object.values(fieldErrors).some(Boolean);
}

function getApiErrorState(error: unknown, fallbackMessage: string) {
  if (error instanceof ApiRequestError) {
    const fieldErrors = getValidationFieldErrors(error.errors);
    const messageFieldErrors = getFieldErrorsFromMessage(error.message);

    return {
      error: hasFieldErrors(fieldErrors) || hasFieldErrors(messageFieldErrors)
        ? ""
        : error.message || fallbackMessage,
      fieldErrors: {
        ...messageFieldErrors,
        ...fieldErrors,
      },
    };
  }

  return {
    error: error instanceof Error ? error.message : fallbackMessage,
    fieldErrors: {},
  };
}

function getValidationFieldErrors(errors: Record<string, unknown> = {}) {
  return Object.entries(API_ERROR_FIELD_MAP).reduce<ChangePasswordFieldErrors>(
    (fieldErrors, [apiField, formField]) => {
      const fieldMessage = getFieldMessages(errors[apiField]).join(" ");

      if (fieldMessage) {
        fieldErrors[formField] =
          formField === "currentPassword"
            ? normalizeCurrentPasswordMessage(fieldMessage)
            : fieldMessage;
      }

      return fieldErrors;
    },
    {},
  );
}

function getFieldErrorsFromMessage(message: string) {
  if (!message) {
    return {};
  }

  if (/current password/i.test(message) && /incorrect|invalid|wrong/i.test(message)) {
    return {
      currentPassword: "Current password is incorrect.",
    } satisfies ChangePasswordFieldErrors;
  }

  return {};
}

function normalizeCurrentPasswordMessage(message: string) {
  return /incorrect|invalid|wrong/i.test(message)
    ? "Current password is incorrect."
    : message;
}

function getFieldMessages(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter(isNonEmptyString);
  }

  return isNonEmptyString(value) ? [value] : [];
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && Boolean(value.trim());
}

export function useChangePassword() {
  const [formState, setFormState] =
    useState<ChangePasswordFormState>(INITIAL_FORM_STATE);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<ChangePasswordFieldErrors>({});
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = useCallback(
    (field: keyof ChangePasswordFormState, value: string) => {
      setFormState((currentFormState) => ({
        ...currentFormState,
        [field]: value,
      }));
      setFieldErrors((currentFieldErrors) => ({
        ...currentFieldErrors,
        [field]: undefined,
      }));
      setError("");
      setFeedbackMessage("");
    },
    [],
  );

  const resetForm = useCallback(() => {
    setFormState(INITIAL_FORM_STATE);
    setError("");
    setFieldErrors({});
    setFeedbackMessage("");
  }, []);

  const submitChangePassword = useCallback(
    async (event?: FormEvent<HTMLFormElement>) => {
      event?.preventDefault();

      if (isSubmitting) {
        return false;
      }

      const nextFieldErrors = validateChangePasswordForm(formState);

      if (hasFieldErrors(nextFieldErrors)) {
        setFieldErrors(nextFieldErrors);
        setError("");
        setFeedbackMessage("");
        return false;
      }

      setError("");
      setFieldErrors({});
      setFeedbackMessage("");

      try {
        setIsSubmitting(true);

        const response = await changePassword({
          currentPassword: formState.currentPassword,
          newPassword: formState.newPassword,
          newPasswordConfirmation: formState.confirmNewPassword,
        });

        setFormState(INITIAL_FORM_STATE);
        setFieldErrors({});
        setFeedbackMessage(response.message || "Password changed successfully.");
        return true;
      } catch (changePasswordError) {
        const nextErrorState = getApiErrorState(
          changePasswordError,
          "Unable to change password. Please try again.",
        );

        setError(nextErrorState.error);
        setFieldErrors(nextErrorState.fieldErrors);
        setFeedbackMessage("");
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [formState, isSubmitting],
  );

  return {
    confirmNewPassword: formState.confirmNewPassword,
    currentPassword: formState.currentPassword,
    error,
    fieldErrors,
    feedbackMessage,
    isSubmitting,
    newPassword: formState.newPassword,
    resetForm,
    submitChangePassword,
    updateConfirmNewPassword: (value: string) =>
      updateField("confirmNewPassword", value),
    updateCurrentPassword: (value: string) =>
      updateField("currentPassword", value),
    updateNewPassword: (value: string) => updateField("newPassword", value),
  };
}
