import { apiRequest, CONTENT_REQUEST_TIMEOUT_MS } from "../../../api";
import type {
  ManagerDirectory,
  ManagerDirectoryApiResponse,
} from "../types";

export const MANAGER_DIRECTORY_PATH = "managers/directory";

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function normalizeManagerDirectoryResponse(
  response: ManagerDirectoryApiResponse,
): ManagerDirectory {
  const directory = response.data;

  if (
    !directory ||
    typeof directory !== "object" ||
    !isNonNegativeNumber(directory.total_managers) ||
    !isNonNegativeNumber(directory.total_companies) ||
    !isNonNegativeNumber(directory.total_booths)
  ) {
    throw new Error("Unexpected manager directory response format.");
  }

  return {
    totalManagers: directory.total_managers,
    managedCompanies: directory.total_companies,
    managedBooths: directory.total_booths,
  };
}

export async function getManagerDirectory(
  signal?: AbortSignal,
): Promise<ManagerDirectory> {
  const response = await apiRequest<ManagerDirectoryApiResponse>(
    MANAGER_DIRECTORY_PATH,
    {
      cache: "no-store",
      method: "GET",
      requiresAuth: true,
      signal,
      timeoutMs: CONTENT_REQUEST_TIMEOUT_MS,
    },
  );

  return normalizeManagerDirectoryResponse(response);
}
