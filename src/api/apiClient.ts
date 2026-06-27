import { getAuthSession } from "../features/auth/utils/authStorage";

export const API_BASE_URL =
  "https://unavailable-towers-skirt-roll.trycloudflare.com/api/v1/admin/";

type ApiErrorBody = {
  error?: string;
  message?: string;
};

type ApiRequestOptions = RequestInit & {
  requiresAuth?: boolean;
};

type JsonRecord = Record<string, unknown>;

export class ApiRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiRequestError";
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
) {
  const requestHeaders = new Headers(headers);

  if (!requestHeaders.has("Content-Type")) {
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
  const { requiresAuth = false, headers, ...requestOptions } = options;

  const response = await fetch(buildApiUrl(path), {
    ...requestOptions,
    headers: buildRequestHeaders(headers, requiresAuth),
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const errorBody = await readJsonResponse<ApiErrorBody>(response);
      message = errorBody.message ?? errorBody.error ?? message;
    } catch {
      // Keep the fallback message when the API does not return JSON.
    }

    throw new ApiRequestError(message, response.status);
  }

  return readJsonResponse<TResponse>(response);
}
