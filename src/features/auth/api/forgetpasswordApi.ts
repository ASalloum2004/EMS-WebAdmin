import { apiRequest } from "../../../api";
import type { AuthSession, LoginCredentials } from "../../../types";

type ForgotPasswordResponse = {
  message: string;
};

export function forgotPassword(email: string): Promise<ForgotPasswordResponse> {
  return apiRequest<ForgotPasswordResponse>("forgot-password", {
    method: "POST",
    body: JSON.stringify({
      email,
    }),
  });
}