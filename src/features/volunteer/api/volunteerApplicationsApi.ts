import {
  CONTENT_REQUEST_TIMEOUT_MS,
  apiRequest,
  apiRequestBlob,
} from "../../../api";
import type {
  GetVolunteerApplicationsParams,
  GetVolunteerApplicationsResult,
  VolunteerApplication,
  VolunteerApplicationCv,
  VolunteerApplicationDetails,
  VolunteerApplicationStatistics,
  VolunteerApplicationStatus,
  VolunteerApplicationsPagination,
} from "../types";

type JsonRecord = Record<string, unknown>;
type VolunteerResponse = { data?: unknown };

export const DEFAULT_VOLUNTEER_APPLICATIONS_PER_PAGE = 5;
export const VOLUNTEER_APPLICATIONS_PATH = "volunteer-applications";

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getPositiveInteger(value: unknown): number | null {
  const numberValue = getNumber(value);
  return numberValue !== null && Number.isInteger(numberValue) && numberValue > 0
    ? numberValue
    : null;
}

function getNonNegativeInteger(value: unknown): number | null {
  const numberValue = getNumber(value);
  return numberValue !== null && Number.isInteger(numberValue) && numberValue >= 0
    ? numberValue
    : null;
}

function getStatus(value: unknown): VolunteerApplicationStatus | null {
  return value === "pending" || value === "approved" || value === "rejected"
    ? value
    : null;
}

function getNullableString(record: JsonRecord, key: string): string | null {
  return getString(record[key]);
}

function assertApplicationId(applicationId: number) {
  if (!Number.isInteger(applicationId) || applicationId < 1) {
    throw new Error("A valid volunteer application ID is required.");
  }
}

function normalizeApplication(value: unknown): VolunteerApplication {
  if (!isRecord(value)) {
    throw new Error("Unexpected volunteer application response format.");
  }
  const id = getPositiveInteger(value.id);
  if (id === null) {
    throw new Error("Unexpected volunteer application response format.");
  }
  return {
    id,
    fullName: getNullableString(value, "full_name") ?? "",
    email: getNullableString(value, "email") ?? "",
    phone: getNullableString(value, "phone") ?? "",
    status: getStatus(value.status),
    createdAt: getNullableString(value, "created_at"),
  };
}

function normalizeCv(value: unknown): VolunteerApplicationCv | null {
  if (!isRecord(value)) {
    return null;
  }
  const id = getPositiveInteger(value.id);
  const name = getString(value.name);
  const url = getString(value.url);
  if (id === null || name === null || url === null) {
    return null;
  }
  return {
    id,
    name,
    mimeType: getNullableString(value, "mime_type"),
    size: getNonNegativeInteger(value.size),
    url,
  };
}

function normalizeDetails(value: unknown): VolunteerApplicationDetails {
  const application = normalizeApplication(value);
  if (!isRecord(value)) {
    throw new Error("Unexpected volunteer application response format.");
  }
  const reviewerValue = isRecord(value.reviewer) ? value.reviewer : null;
  const reviewerId = reviewerValue ? getPositiveInteger(reviewerValue.id) : null;
  const reviewer =
    reviewerValue && reviewerId !== null
      ? {
          id: reviewerId,
          name: getNullableString(reviewerValue, "name") ?? "",
          email: getNullableString(reviewerValue, "email") ?? "",
        }
      : null;
  const notification = isRecord(value.whatsapp_notification)
    ? value.whatsapp_notification
    : {};

  return {
    ...application,
    motivation: getNullableString(value, "motivation"),
    educationOrOccupation: getNullableString(value, "education_or_occupation"),
    skills: getNullableString(value, "skills"),
    city: getNullableString(value, "city"),
    privacyConsentAt: getNullableString(value, "privacy_consent_at"),
    cv: normalizeCv(value.cv),
    reviewedAt: getNullableString(value, "reviewed_at"),
    reviewNote: getNullableString(value, "review_note"),
    reviewer,
    whatsappNotification: {
      sentAt: getNullableString(notification, "sent_at"),
      failedAt: getNullableString(notification, "failed_at"),
    },
    updatedAt: getNullableString(value, "updated_at"),
  };
}

function normalizePagination(value: unknown): VolunteerApplicationsPagination {
  if (!isRecord(value)) {
    throw new Error("Unexpected volunteer application pagination format.");
  }
  const currentPage = getPositiveInteger(value.current_page);
  const perPage = getPositiveInteger(value.per_page);
  const totalItems = getNonNegativeInteger(value.total);
  const totalPages = getPositiveInteger(value.last_page);
  if (
    currentPage === null ||
    perPage === null ||
    totalItems === null ||
    totalPages === null
  ) {
    throw new Error("Unexpected volunteer application pagination format.");
  }
  return { currentPage, perPage, totalItems, totalPages };
}

export function buildVolunteerApplicationsPath(
  params: GetVolunteerApplicationsParams = {},
) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.perPage) searchParams.set("per_page", String(params.perPage));
  if (params.search?.trim()) searchParams.set("filter[search]", params.search.trim());
  if (params.status) searchParams.set("filter[status]", params.status);
  if (params.sort) searchParams.set("sort", params.sort);
  const query = searchParams.toString();
  return query
    ? `${VOLUNTEER_APPLICATIONS_PATH}?${query}`
    : VOLUNTEER_APPLICATIONS_PATH;
}

export function buildVolunteerApplicationPath(applicationId: number) {
  assertApplicationId(applicationId);
  return `${VOLUNTEER_APPLICATIONS_PATH}/${applicationId}`;
}

export function buildVolunteerApplicationReviewPath(
  applicationId: number,
  decision: "approve" | "reject",
) {
  return `${buildVolunteerApplicationPath(applicationId)}/${decision}`;
}

export function buildVolunteerApplicationCvPath(applicationId: number) {
  return `${buildVolunteerApplicationPath(applicationId)}/cv`;
}

export async function getVolunteerApplications(
  params: GetVolunteerApplicationsParams = {},
  signal?: AbortSignal,
): Promise<GetVolunteerApplicationsResult> {
  const response = await apiRequest<VolunteerResponse>(
    buildVolunteerApplicationsPath(params),
    { method: "GET", requiresAuth: true, signal, timeoutMs: CONTENT_REQUEST_TIMEOUT_MS },
  );
  const payload = isRecord(response.data) ? response.data : null;
  if (!payload || !Array.isArray(payload.data)) {
    throw new Error("Unexpected volunteer applications response format.");
  }
  return {
    applications: payload.data.map(normalizeApplication),
    pagination: normalizePagination(payload),
  };
}

export async function getVolunteerApplicationStatistics(
  signal?: AbortSignal,
): Promise<VolunteerApplicationStatistics> {
  const response = await apiRequest<VolunteerResponse>(
    `${VOLUNTEER_APPLICATIONS_PATH}/statistics`,
    { method: "GET", requiresAuth: true, signal, timeoutMs: CONTENT_REQUEST_TIMEOUT_MS },
  );
  const payload = isRecord(response.data) ? response.data : null;
  if (!payload) {
    throw new Error("Unexpected volunteer application statistics response format.");
  }
  const total = getNonNegativeInteger(payload.total);
  const pending = getNonNegativeInteger(payload.pending);
  const approved = getNonNegativeInteger(payload.approved);
  const rejected = getNonNegativeInteger(payload.rejected);
  if (total === null || pending === null || approved === null || rejected === null) {
    throw new Error("Unexpected volunteer application statistics response format.");
  }
  return { total, pending, approved, rejected };
}

export async function getVolunteerApplicationDetails(
  applicationId: number,
  signal?: AbortSignal,
): Promise<VolunteerApplicationDetails> {
  const response = await apiRequest<VolunteerResponse>(
    buildVolunteerApplicationPath(applicationId),
    { method: "GET", requiresAuth: true, signal, timeoutMs: CONTENT_REQUEST_TIMEOUT_MS },
  );
  return normalizeDetails(response.data);
}

export async function reviewVolunteerApplication(
  applicationId: number,
  decision: "approve" | "reject",
  reviewNote: string,
): Promise<void> {
  await apiRequest<unknown>(buildVolunteerApplicationReviewPath(applicationId, decision), {
    method: "PATCH",
    requiresAuth: true,
    body: JSON.stringify({ review_note: reviewNote.trim() || null }),
  });
}

export async function getVolunteerApplicationCv(applicationId: number): Promise<Blob> {
  return apiRequestBlob(buildVolunteerApplicationCvPath(applicationId), {
    method: "GET",
    requiresAuth: true,
    headers: {
      Accept: "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    },
  });
}
