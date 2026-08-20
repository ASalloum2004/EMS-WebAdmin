import { apiRequest } from "../../../api";
import type { BoothRequestActionResponse } from "../types";

function validateRequestId(requestId: number) {
  if (!Number.isInteger(requestId) || requestId < 1) {
    throw new Error("A valid request ID is required.");
  }
}

function normalizePaymentReminderResponse(
  response: BoothRequestActionResponse,
): BoothRequestActionResponse {
  const message = typeof response.message === "string" ? response.message.trim() : "";

  if (response.status !== true || !message || response.data !== null) {
    throw new Error("Unexpected payment reminder response format.");
  }

  return { status: true, message, data: null };
}

export function buildBoothPaymentReminderPath(boothRequestId: number) {
  validateRequestId(boothRequestId);
  return `booths/requests/payment-reminder/${boothRequestId}`;
}

export function buildEventPaymentReminderPath(eventRequestId: number) {
  validateRequestId(eventRequestId);
  return `events/requests/${eventRequestId}/payment-reminder`;
}

export async function sendBoothPaymentReminder(boothRequestId: number) {
  const response = await apiRequest<BoothRequestActionResponse>(
    buildBoothPaymentReminderPath(boothRequestId),
    { method: "POST", requiresAuth: true },
  );
  return normalizePaymentReminderResponse(response);
}

export async function sendEventPaymentReminder(eventRequestId: number) {
  const response = await apiRequest<BoothRequestActionResponse>(
    buildEventPaymentReminderPath(eventRequestId),
    { method: "POST", requiresAuth: true },
  );
  return normalizePaymentReminderResponse(response);
}
