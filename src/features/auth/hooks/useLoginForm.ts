import { useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../../../context";
import { isBlank } from "../../../utils";
import type { LoginCredentials } from "../types";

export function useLoginForm() {
  const { signIn } = useAuth();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  function updateField(field: keyof LoginCredentials, value: string) {
    setCredentials((currentCredentials) => ({
      ...currentCredentials,
      [field]: value,
    }));

    if (error) {
      setError("");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    

    if (isBlank(credentials.email) || isBlank(credentials.password)) {
      setError("Please enter your email and password.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await signIn(credentials, rememberMe);
      window.location.replace("/dashboard");
    } catch {
      setError("password or email inncorect.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    credentials,
    error,
    handleSubmit,
    isSubmitting,
    rememberMe,
    toggleRememberMe: () => setRememberMe((currentValue) => !currentValue),
    updateField,
  };
}
