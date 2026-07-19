import { apiRequest } from "../../../api";
import type { BoothRequestActionResponse } from "../types";

export function buildRejectBoothRequestPath(boothRequestId: number) {
  if (
    !Number.isFinite(boothRequestId) ||
    boothRequestId < 1 ||
    !Number.isInteger(boothRequestId)
  ) {
    throw new Error("A valid booth request ID is required.");
  }

  return `booths/requests/reject/${boothRequestId}`;
}

export function normalizeBoothRequestActionResponse(
  response: BoothRequestActionResponse,
): BoothRequestActionResponse {
  const message =
    typeof response.message === "string" ? response.message.trim() : "";

  if (response.status !== true || !message || response.data !== null) {
    throw new Error("Unexpected booth request action response format.");
  }

  return {
    status: true,
    message,
    data: null,
  };
}

export async function rejectBoothRequest(
  boothRequestId: number,
): Promise<BoothRequestActionResponse> {
  const response = await apiRequest<BoothRequestActionResponse>(
    buildRejectBoothRequestPath(boothRequestId),
    {
      method: "PATCH",
      requiresAuth: true,
    },
  );

  return normalizeBoothRequestActionResponse(response);
}
