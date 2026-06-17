import { useState } from "react";
import type { FormEvent } from "react";

export function useResetPasswordForm() {
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

    if (!password.trim()) {
      setError("Please enter your new password.");
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

      console.log("Password reset UI is working");
      console.log("New password:", password);

      // لاحقاً هون بنستدعي resetPassword API
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