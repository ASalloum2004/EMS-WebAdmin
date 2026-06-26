import { useState } from "react";
import type { FormEvent } from "react";
import { resetPassword } from "../api";

interface UseResetPasswordFormParams {
  token: string | null;
  email: string | null;
  onSuccess?: () => void;
}

export function useResetPasswordForm({
  token,
  email,
  onSuccess,
}: UseResetPasswordFormParams) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updatePassword(value: string) {
    setPassword(value);

    if (error) {
      setError("");
    }
  }

  function updateConfirmPassword(value: string) {
    setConfirmPassword(value);

    if (error) {
      setError("");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!token || !email) {
      setError("Invalid reset password link.");
      return;
    }

    if (!password.trim()) {
      setError("Please enter your new password.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (!confirmPassword.trim()) {
      setError("Please confirm your new password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);

      await resetPassword({
        token,
        email,
        password,
        password_confirmation: confirmPassword,
      });

      onSuccess?.();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to reset password. Please try again.";

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    password,
    confirmPassword,
    error,
    isSubmitting,
    handleSubmit,
    updatePassword,
    updateConfirmPassword,
  };
}