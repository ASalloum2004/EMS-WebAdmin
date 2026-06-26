import { apiRequest } from "../../../api";

type ResetPasswordPayload = {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
};

type ResetPasswordResponse = {
  message: string;
};

export function resetPassword(
  payload: ResetPasswordPayload
): Promise<ResetPasswordResponse> {
  return apiRequest<ResetPasswordResponse>("reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}