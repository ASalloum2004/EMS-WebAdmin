export const API_BASE_URL =
  "https://unavailable-towers-skirt-roll.trycloudflare.com/api/v1/admin/";

type ApiErrorBody = {
  error?: string;
  message?: string;
};

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
  options: RequestInit = {},
): Promise<TResponse> {
  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    let message = "Request failed";

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
