import {
  apiRequest,
  CONTENT_REQUEST_TIMEOUT_MS,
  resolveApiMediaUrl,
} from "../../../api";
import type {
  ManagerBooth,
  ManagerBoothApiData,
  ManagerDetails,
  ManagerDetailsApiResponse,
  ManagerPortfolio,
  ManagerPortfolioApiData,
} from "../types";

function getTrimmedString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeBooth(booth: ManagerBoothApiData): ManagerBooth {
  return {
    number: getTrimmedString(booth.number),
    hall: getTrimmedString(booth.hall),
    label: getTrimmedString(booth.label),
  };
}

function normalizePortfolio(
  portfolio: ManagerPortfolioApiData,
): ManagerPortfolio {
  if (!Array.isArray(portfolio.booths)) {
    throw new Error("Unexpected manager portfolio response format.");
  }

  return {
    name: getTrimmedString(portfolio.name) ?? "",
    businessSector: getTrimmedString(portfolio.business_sector),
    phone: getTrimmedString(portfolio.phone),
    status: getTrimmedString(portfolio.status),
    logo: resolveApiMediaUrl(portfolio.logo),
    booths: portfolio.booths.map(normalizeBooth),
  };
}

export function buildManagerDetailsPath(managerId: number) {
  if (
    !Number.isFinite(managerId) ||
    managerId < 1 ||
    !Number.isInteger(managerId)
  ) {
    throw new Error("A valid manager identifier is required.");
  }

  return `managers/${managerId}`;
}

export function normalizeManagerDetailsResponse(
  response: ManagerDetailsApiResponse,
): ManagerDetails {
  const details = response.data;

  if (
    !details ||
    typeof details !== "object" ||
    !Array.isArray(details.portfolios)
  ) {
    throw new Error("Unexpected manager details response format.");
  }

  return {
    name: getTrimmedString(details.name) ?? "",
    email: getTrimmedString(details.email),
    avatar: resolveApiMediaUrl(details.avatar),
    portfolios: details.portfolios.map(normalizePortfolio),
  };
}

export async function getManagerDetails(
  managerId: number,
  signal?: AbortSignal,
): Promise<ManagerDetails> {
  const response = await apiRequest<ManagerDetailsApiResponse>(
    buildManagerDetailsPath(managerId),
    {
      cache: "no-store",
      method: "GET",
      requiresAuth: true,
      signal,
      timeoutMs: CONTENT_REQUEST_TIMEOUT_MS,
    },
  );

  return normalizeManagerDetailsResponse(response);
}
