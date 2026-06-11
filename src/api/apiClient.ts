export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export async function apiRequest<TResponse>(
  path: string,
  options: RequestInit = {},
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error("Request failed");
  }

  return response.json() as Promise<TResponse>;
}
