import { apiRequest } from "../../../api";


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