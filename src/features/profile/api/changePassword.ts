import { apiRequest } from "../../../api";
import type {
  ChangePasswordApiPayload,
  ChangePasswordPayload,
  ChangePasswordResponse,
} from "../types";

function mapChangePasswordPayload(
  payload: ChangePasswordPayload,
): ChangePasswordApiPayload {
  return {
    current_password: payload.currentPassword,
    new_password: payload.newPassword,
    new_password_confirmation: payload.newPasswordConfirmation,
  };
}

export function changePassword(
  payload: ChangePasswordPayload,
): Promise<ChangePasswordResponse> {
  return apiRequest<ChangePasswordResponse>("change-password", {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify(mapChangePasswordPayload(payload)),
  });
}
