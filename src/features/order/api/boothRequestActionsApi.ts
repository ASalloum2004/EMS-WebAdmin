import { apiRequest } from "../../../api";
import type {
  ApproveBoothRequestPayload,
  ApproveBoothRequestResponse,
  BoothRequestActionResponse,
} from "../types";

function validateBoothRequestId(boothRequestId: number) {
  if (
    !Number.isFinite(boothRequestId) ||
    boothRequestId < 1 ||
    !Number.isInteger(boothRequestId)
  ) {
    throw new Error("A valid booth request ID is required.");
  }
}

export function buildRejectBoothRequestPath(boothRequestId: number) {
  validateBoothRequestId(boothRequestId);

  return `booths/requests/reject/${boothRequestId}`;
}

export function buildApproveBoothRequestPath(boothRequestId: number) {
  validateBoothRequestId(boothRequestId);

  return `booths/requests/approve/${boothRequestId}`;
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

export function normalizeApproveBoothRequestResponse(
  response: BoothRequestActionResponse,
): ApproveBoothRequestResponse {
  const message =
    typeof response.message === "string" ? response.message.trim() : "";

  if (response.status !== true) {
    throw new Error(
      message || "Unexpected booth request action response format.",
    );
  }

  if (!message || response.data !== null) {
    throw new Error("Unexpected booth request action response format.");
  }

  return {
    status: true,
    message,
    data: null,
  };
}

export async function approveBoothRequest(
  boothRequestId: number,
): Promise<ApproveBoothRequestResponse> {
  const payload: ApproveBoothRequestPayload = { force: false };
  const response = await apiRequest<BoothRequestActionResponse>(
    buildApproveBoothRequestPath(boothRequestId),
    {
      body: JSON.stringify(payload),
      method: "POST",
      requiresAuth: true,
    },
  );

  return normalizeApproveBoothRequestResponse(response);
}
