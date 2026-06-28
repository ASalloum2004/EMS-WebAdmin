import { getAuthSession } from "../features/auth/utils/authStorage";

export const API_BASE_URL =
  "https://unavailable-towers-skirt-roll.trycloudflare.com/api/v1/admin/";

type ApiErrorBody = {
  error?: string;
  errors?: Record<string, unknown>;
  message?: string;
};

type ApiRequestOptions = RequestInit & {
  requiresAuth?: boolean;
};

type JsonRecord = Record<string, unknown>;

export class ApiRequestError extends Error {
  errors?: Record<string, unknown>;
  status: number;

  constructor(
    message: string,
    status: number,
    errors?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.errors = errors;
    this.status = status;
  }
}

function buildApiUrl(path: string) {
  const baseUrl = API_BASE_URL.replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  return `${baseUrl}${cleanPath}`;
}

function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null;
}

function getStringValue(record: JsonRecord, key: string) {
  const value = record[key];

  return typeof value === "string" && value.trim() ? value : null;
}

function getAuthTokenFromSession(session: unknown): string | null {
  if (!isJsonRecord(session)) {
    return null;
  }

  const token =
    getStringValue(session, "token") ??
    getStringValue(session, "accessToken") ??
    getStringValue(session, "access_token");

  if (token) {
    return token;
  }

  return getAuthTokenFromSession(session.data);
}

function buildRequestHeaders(
  headers: HeadersInit | undefined,
  requiresAuth: boolean,
  hasFormDataBody: boolean,
) {
  const requestHeaders = new Headers(headers);

  if (!requestHeaders.has("Accept")) {
    requestHeaders.set("Accept", "application/json");
  }

  if (!hasFormDataBody && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (requiresAuth && !requestHeaders.has("Authorization")) {
    const token = getAuthTokenFromSession(getAuthSession());

    if (!token) {
      throw new ApiRequestError("Missing authentication token.", 401);
    }

    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  return requestHeaders;
}

function isFormDataBody(body: BodyInit | null | undefined): body is FormData {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

async function readJsonResponse<TResponse>(
  response: Response,
): Promise<TResponse> {
  const text = await response.text();

  if (!text) {
    return {} as TResponse;
  }

  return JSON.parse(text) as TResponse;
}

export async function apiRequest<TResponse>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<TResponse> {
  const { requiresAuth = false, headers, body, ...requestOptions } = options;
  const hasFormDataBody = isFormDataBody(body);

  const response = await fetch(buildApiUrl(path), {
    ...requestOptions,
    body,
    headers: buildRequestHeaders(headers, requiresAuth, hasFormDataBody),
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    let errors: Record<string, unknown> | undefined;

    try {
      const errorBody = await readJsonResponse<ApiErrorBody>(response);
      message = errorBody.message ?? errorBody.error ?? message;
      errors = isJsonRecord(errorBody.errors) ? errorBody.errors : undefined;
    } catch {
      // Keep the fallback message when the API does not return JSON.
    }

    throw new ApiRequestError(message, response.status, errors);
  }

  return readJsonResponse<TResponse>(response);
}
