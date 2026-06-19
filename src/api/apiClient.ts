export const API_BASE_URL =
  "https://quilt-trusts-facing-operates.trycloudflare.com/api/v1/admin/";

function buildApiUrl(path: string) {
  const baseUrl = API_BASE_URL.replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  return `${baseUrl}${cleanPath}`;
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
    throw new Error("Request failed");
  }

  return response.json() as Promise<TResponse>;
}