import { useCallback, useState, type FormEvent } from "react";

const INITIAL_FORM_STATE = {
  currentPassword: "",
  newPassword: "",
  confirmNewPassword: "",
};

type ChangePasswordFormState = typeof INITIAL_FORM_STATE;

function validateChangePasswordForm({
  currentPassword,
  newPassword,
  confirmNewPassword,
}: ChangePasswordFormState) {
  if (!currentPassword.trim()) {
    return "Current password is required.";
  }

  if (!newPassword.trim()) {
    return "New password is required.";
  }

  if (!confirmNewPassword.trim()) {
    return "Confirm new password is required.";
  }

  if (newPassword !== confirmNewPassword) {
    return "New password and confirm password must match.";
  }

  return "";
}

export function useChangePassword() {
  const [formState, setFormState] =
    useState<ChangePasswordFormState>(INITIAL_FORM_STATE);
  const [error, setError] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const updateField = useCallback(
    (field: keyof ChangePasswordFormState, value: string) => {
      setFormState((currentFormState) => ({
        ...currentFormState,
        [field]: value,
      }));
      setError("");
      setFeedbackMessage("");
    },
    [],
  );

  const resetForm = useCallback(() => {
    setFormState(INITIAL_FORM_STATE);
    setError("");
    setFeedbackMessage("");
  }, []);

  const submitChangePassword = useCallback(
    (event?: FormEvent<HTMLFormElement>) => {
      event?.preventDefault();

      const validationError = validateChangePasswordForm(formState);

      if (validationError) {
        setError(validationError);
        setFeedbackMessage("");
        return false;
      }

      setError("");
      setFeedbackMessage("");
      // TODO: Integrate the Change Password API in the next implementation step.
      return true;
    },
    [formState],
  );

  return {
    confirmNewPassword: formState.confirmNewPassword,
    currentPassword: formState.currentPassword,
    error,
    feedbackMessage,
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
