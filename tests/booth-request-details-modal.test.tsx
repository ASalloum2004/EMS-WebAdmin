import "./setup-dom.js";
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { StrictMode, useCallback, useState } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  waitFor,
  within,
} from "@testing-library/react";
import { DataTable, type DataTableColumn } from "../src/components/DataTable/DataTable.js";
import { BoothRequestDetailsModal } from "../src/features/order/components/BoothRequestDetailsModal/BoothRequestDetailsModal.js";
import { CompanyAvatar } from "../src/features/order/components/BoothRequestDetailsModal/BoothRequestDetailsSideColumn.js";
import { BoothRequestDetailsActions } from "../src/features/order/components/BoothRequestDetailsModal/BoothRequestDetailsActions.js";
import { ApproveBoothRequestConfirmModal } from "../src/features/order/components/ApproveBoothRequestConfirmModal/ApproveBoothRequestConfirmModal.js";
import { RejectBoothRequestConfirmModal } from "../src/features/order/components/RejectBoothRequestConfirmModal/RejectBoothRequestConfirmModal.js";
import { normalizeBoothRequestDetailsResponse } from "../src/features/order/api/boothRequestDetailsApi.js";
import { useBoothRequestDetails } from "../src/features/order/hooks/useBoothRequestDetails.js";
import { useBoothRequestActions } from "../src/features/order/hooks/useBoothRequestActions/index.js";
import { API_BASE_URL } from "../src/api/index.js";
import type {
  BoothRequestActionResponse,
  BoothRequestApiData,
  BoothRequestDetailsApiData,
  BoothRequestDetailsResponse,
} from "../src/features/order/types.js";
import { I18nProvider } from "../src/i18n/I18nContext.js";
import { ar } from "../src/i18n/locales/ar.js";
import { en } from "../src/i18n/locales/en.js";

const firstRequest: BoothRequestApiData = {
  booth_id: 9,
  company_id: 37,
  company_name: "First Company",
  created_at: "2026-07-14 10:01:00",
  final_price: 10,
  id: 901,
  reason_for_booking: "List data must not populate the details modal.",
  status: "rejected",
};

const secondRequest: BoothRequestApiData = {
  booth_id: 12,
  company_id: 52,
  company_name: "Second Company",
  created_at: "2026-07-15 10:01:00",
  final_price: 20,
  id: 902,
  reason_for_booking: "Second list request.",
  status: "pending",
};

const firstDetails: BoothRequestDetailsApiData = {
  id: 901,
  booth_id: 1,
  company_id: 37,
  status: "approved",
  reason_for_booking: "Exhibitor booth request created for Dar Al feker.",
  final_price: 250,
  created_at: "2026-07-14 12:00:59",
  services: [],
  company: {
    id: 1,
    name: "Dar Al feker",
    business_sector: "Lectures & Exhibitions",
    phone: "+963112223334",
    description: "Leading readers for reading.",
    year_founded: 2015,
    social_links: {
      website: "https://dar.com",
      linkedin: "https://linkedin.com/company/dar",
    },
    headquarters_lat: 33.513807,
    headquarters_lng: 36.276528,
    status: "pending",
    logo: "",
    gallery: [],
  },
};

const secondDetails: BoothRequestDetailsApiData = {
  ...firstDetails,
  id: 902,
  booth_id: 12,
  company_id: 52,
  status: "pending",
  company: {
    ...firstDetails.company,
    id: 52,
    name: "Second Company",
    status: "approved",
  },
};

const rejectSuccessResponse: BoothRequestActionResponse = {
  status: true,
  message: "request rejected successfully",
  data: null,
};

const approveSuccessResponse = {
  status: true as const,
  message: "request approved successfully",
  data: null,
};

const approveSuccessResult = {
  kind: "approved" as const,
  response: approveSuccessResponse,
};

const idleActionProps = {
  isApproving: false,
  isRejecting: false,
  onApproveClick: () => undefined,
  onRejectClick: () => undefined,
};

const columns: Array<DataTableColumn<BoothRequestApiData>> = [
  {
    key: "company_id",
    label: "Company ID",
    render: (request) => `Company #${request.company_id}`,
    variant: "primary",
  },
  {
    key: "booth_id",
    label: "Booth ID",
    render: (request) => `Booth #${request.booth_id}`,
    variant: "metric",
  },
];

function RequestDetailsHarness({
  onListRefresh,
  onStatisticsRefresh,
  requests = [firstRequest],
}: {
  onListRefresh?: () => Promise<unknown> | unknown;
  onStatisticsRefresh?: () => Promise<unknown> | unknown;
  requests?: BoothRequestApiData[];
}) {
  const [request, setRequest] = useState<BoothRequestApiData | null>(null);
  const requestDetails = useBoothRequestDetails(request?.id ?? null);
  const refreshAfterRequestAction = useCallback(async () => {
    await Promise.all([
      requestDetails.refetch(),
      onListRefresh?.(),
      onStatisticsRefresh?.(),
    ]);
  }, [onListRefresh, onStatisticsRefresh, requestDetails.refetch]);
  const requestActions = useBoothRequestActions({
    approveConflictFallbackMessage: en.order.approveConflict.loadError,
    approveFallbackMessage: en.order.approveConfirmation.error,
    onApproveSuccess: refreshAfterRequestAction,
    onRejectSuccess: refreshAfterRequestAction,
    rejectFallbackMessage: en.order.rejectConfirmation.error,
  });

  const closeDetails = useCallback(() => {
    requestActions.closeApproveConflict();
    requestActions.clearApproveError();
    requestActions.clearRejectError();
    setRequest(null);
  }, [
    requestActions.closeApproveConflict,
    requestActions.clearApproveError,
    requestActions.clearRejectError,
  ]);

  return (
    <I18nProvider>
      <DataTable
        ariaLabel="Booth requests"
        columns={columns}
        getItemAriaLabel={(item) =>
          `View details for Company #${item.company_id}`
        }
        getItemKey={(item) => item.id}
        items={requests}
        onItemClick={setRequest}
      />
      {request ? (
        <BoothRequestDetailsModal
          approveConflict={requestActions.approveConflict}
          approveConflictError={requestActions.approveConflictError}
          approveError={requestActions.approveError}
          details={requestDetails.details}
          error={requestDetails.error}
          isApproving={requestActions.isApproving}
          isLoading={requestDetails.isLoading}
          isLoadingApproveConflicts={
            requestActions.isLoadingApproveConflicts
          }
          isRejecting={requestActions.isRejecting}
          onApprove={requestActions.approveBoothRequestById}
          onApproveAnyway={requestActions.approveBoothRequestAnyway}
          onApproveConflictPageChange={requestActions.loadApproveConflictPage}
          onClearApproveError={requestActions.clearApproveError}
          onClearRejectError={requestActions.clearRejectError}
          onClose={closeDetails}
          onCloseApproveConflict={requestActions.closeApproveConflict}
          onReject={requestActions.rejectBoothRequestById}
          onRetry={() => void requestDetails.refetch()}
          rejectError={requestActions.rejectError}
        />
      ) : null}
    </I18nProvider>
  );
}

function getResponse(details: BoothRequestDetailsResponse["data"]) {
  const response: BoothRequestDetailsResponse = {
    status: true,
    message: "booth request retrived successfully",
    data: details,
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function getRejectResponse() {
  return new Response(JSON.stringify(rejectSuccessResponse), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function getApproveResponse() {
  return new Response(JSON.stringify(approveSuccessResponse), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function getApproveConflictResponse({
  currentPage = 1,
  lastPage = 1,
  requests = [
    {
      id: 5,
      booth_id: 12,
      company_id: 37,
      status: "pending",
      final_price: 160,
    },
    {
      id: 6,
      booth_id: 12,
      company_id: 52,
      status: "pending",
      final_price: null,
    },
  ],
  total = requests.length,
}: {
  currentPage?: number;
  lastPage?: number;
  requests?: Array<{
    booth_id: number | null;
    company_id: number | null;
    final_price: number | null;
    id: number | null;
    status: string | null;
  }>;
  total?: number;
} = {}) {
  return new Response(
    JSON.stringify({
      status: false,
      message: "Conflicting requests retrieved",
      errors: {
        data: {
          data: requests,
          meta: {
            current_page: currentPage,
            per_page: 3,
            total,
            last_page: lastPage,
          },
        },
      },
    }),
    {
      status: 409,
      headers: { "Content-Type": "application/json" },
    },
  );
}

function getRequestedUrl(input: RequestInfo | URL) {
  return typeof input === "string"
    ? input
    : input instanceof URL
      ? input.toString()
      : input.url;
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, reject, resolve };
}

function renderHarness(
  requests?: BoothRequestApiData[],
  refreshCallbacks: {
    onListRefresh?: () => Promise<unknown> | unknown;
    onStatisticsRefresh?: () => Promise<unknown> | unknown;
  } = {},
) {
  return render(
    <StrictMode>
      <RequestDetailsHarness
        onListRefresh={refreshCallbacks.onListRefresh}
        onStatisticsRefresh={refreshCallbacks.onStatisticsRefresh}
        requests={requests}
      />
    </StrictMode>,
  );
}

function openRequestDetails(
  view: ReturnType<typeof renderHarness>,
  companyId = 37,
) {
  const row = view.getByRole("button", {
    name: `View details for Company #${companyId}`,
  });

  fireEvent.click(row);

  return row;
}

const originalFetch = globalThis.fetch;
const sessionStorageDescriptor = Object.getOwnPropertyDescriptor(
  globalThis,
  "sessionStorage",
);

beforeEach(() => {
  window.localStorage.setItem("ems-language", "en");
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
      getItem: (key: string) =>
        key === "auth_session"
          ? JSON.stringify({ token: "details-test-token" })
          : null,
    } as Storage,
  });
});

afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
  globalThis.fetch = originalFetch;

  if (sessionStorageDescriptor) {
    Object.defineProperty(
      globalThis,
      "sessionStorage",
      sessionStorageDescriptor,
    );
  } else {
    Reflect.deleteProperty(globalThis, "sessionStorage");
  }
});

test("clicking a row requests details with the selected request id", async () => {
  const requestedUrls: string[] = [];
  const requestMethods: string[] = [];
  globalThis.fetch = async (input, init) => {
    requestedUrls.push(getRequestedUrl(input));
    requestMethods.push(init?.method ?? "");
    return getResponse(firstDetails);
  };
  const view = renderHarness();

  openRequestDetails(view);

  assert.ok(view.getByRole("dialog"));
  assert.ok(view.getByRole("status"));
  await view.findByRole("heading", { name: "Dar Al feker" });

  assert.equal(requestedUrls.length, 1);
  assert.equal(
    new URL(requestedUrls[0] ?? "").pathname,
    "/api/v1/admin/booths/requests/901",
  );
  assert.equal(requestMethods[0], "GET");
});

test("the modal maps request and company details without mock content", async () => {
  globalThis.fetch = async () => getResponse(firstDetails);
  const view = renderHarness();

  openRequestDetails(view);

  const companyHeading = await view.findByRole("heading", {
    name: "Dar Al feker",
  });
  const dialog = view.getByRole("dialog");
  const profileCard = view
    .getByRole("heading", { name: "Company Profile" })
    .closest("section");
  const totalAmount = dialog.querySelector(
    ".booth-request-details-modal__total-amount",
  );

  assert.ok(companyHeading);
  assert.ok(profileCard);
  assert.match(dialog.textContent ?? "", /Lectures & Exhibitions/);
  assert.match(dialog.textContent ?? "", /Booth #1/);
  assert.match(dialog.textContent ?? "", /Jul 14, 2026/);
  assert.match(dialog.textContent ?? "", /Booth Booking/);
  assert.match(
    dialog.textContent ?? "",
    /Exhibitor booth request created for Dar Al feker\./,
  );
  assert.ok(within(profileCard).getByText("#1"));
  assert.ok(within(profileCard).getByText("2015"));
  assert.match(profileCard.textContent ?? "", /33\.513807, 36\.276528/);
  assert.equal(totalAmount?.textContent, "250");
  assert.match(dialog.textContent ?? "", /\+963112223334/);
  assert.equal(dialog.textContent?.includes("Nexora"), false);
  assert.equal(dialog.textContent?.includes("Maya Hassan"), false);
  assert.equal(dialog.textContent?.includes("maya.hassan"), false);
  assert.equal(dialog.textContent?.includes("Partnerships Manager"), false);
  assert.equal(dialog.textContent?.includes("Request #901"), false);

  const contactCard = view
    .getByRole("heading", { name: "Point of Contact" })
    .closest("section");
  const totalAmountCard = view
    .getByRole("heading", { name: "Total Amount" })
    .closest("section");

  assert.ok(contactCard);
  assert.ok(totalAmountCard);
  const phone = within(contactCard).getByRole("link", {
    name: "Phone: +963112223334",
  });
  const website = within(contactCard).getByRole("link", {
    name: "Website: Visit website",
  });
  const linkedin = within(contactCard).getByRole("link", {
    name: "LinkedIn: View profile",
  });

  assert.equal(phone.getAttribute("href"), "tel:+963112223334");
  assert.ok(
    phone.classList.contains(
      "booth-request-details-modal__contact-item--phone",
    ),
  );
  assert.equal(website.getAttribute("href"), "https://dar.com/");
  assert.equal(website.getAttribute("target"), "_blank");
  assert.equal(website.getAttribute("rel"), "noopener noreferrer");
  assert.equal(linkedin.getAttribute("target"), "_blank");
  assert.equal(linkedin.getAttribute("rel"), "noopener noreferrer");
  assert.ok(linkedin.querySelector(".lucide-square-user-round"));
  assert.equal(
    linkedin.querySelector(".lucide-briefcase-business"),
    null,
  );
  assert.equal(
    website.classList.contains(
      "booth-request-details-modal__contact-item--social-single",
    ),
    false,
  );
  assert.equal(
    linkedin.classList.contains(
      "booth-request-details-modal__contact-item--social-single",
    ),
    false,
  );
  assert.equal(contactCard.nextElementSibling, totalAmountCard);
});

test("missing contact methods are omitted and one social link spans its row", async () => {
  const websiteOnlyDetails: BoothRequestDetailsApiData = {
    ...firstDetails,
    company: {
      ...firstDetails.company,
      phone: "",
      social_links: {
        website: "https://dar.com",
        linkedin: "",
      },
    },
  };
  globalThis.fetch = async () => getResponse(websiteOnlyDetails);
  const view = renderHarness();

  openRequestDetails(view);
  await view.findByRole("heading", { name: "Dar Al feker" });

  const contactCard = view
    .getByRole("heading", { name: "Point of Contact" })
    .closest("section");

  assert.ok(contactCard);
  const website = within(contactCard).getByRole("link", {
    name: "Website: Visit website",
  });
  assert.ok(
    website.classList.contains(
      "booth-request-details-modal__contact-item--social-single",
    ),
  );
  assert.equal(
    within(contactCard).queryByRole("link", { name: /^Phone:/ }),
    null,
  );
  assert.equal(
    within(contactCard).queryByRole("link", { name: /^LinkedIn:/ }),
    null,
  );
  assert.equal(contactCard.textContent?.includes("Not available"), false);
  assert.equal(contactCard.textContent?.includes("—"), false);
});

test("phone-only contact details do not render an empty social row", async () => {
  const phoneOnlyDetails: BoothRequestDetailsApiData = {
    ...firstDetails,
    company: {
      ...firstDetails.company,
      social_links: {
        website: "",
        linkedin: "",
      },
    },
  };
  globalThis.fetch = async () => getResponse(phoneOnlyDetails);
  const view = renderHarness();

  openRequestDetails(view);
  await view.findByRole("heading", { name: "Dar Al feker" });

  const contactCard = view
    .getByRole("heading", { name: "Point of Contact" })
    .closest("section");

  assert.ok(contactCard);
  assert.equal(within(contactCard).getAllByRole("link").length, 1);
  assert.ok(
    within(contactCard).getByRole("link", {
      name: "Phone: +963112223334",
    }),
  );
  assert.equal(
    contactCard.querySelectorAll(
      ".booth-request-details-modal__contact-item",
    ).length,
    1,
  );
});

test("missing all contact values displays one compact empty state", async () => {
  const noContactDetails: BoothRequestDetailsApiData = {
    ...firstDetails,
    company: {
      ...firstDetails.company,
      phone: "",
      social_links: {
        website: "",
        linkedin: "",
      },
    },
  };
  globalThis.fetch = async () => getResponse(noContactDetails);
  const view = renderHarness();

  openRequestDetails(view);
  await view.findByRole("heading", { name: "Dar Al feker" });

  const contactCard = view
    .getByRole("heading", { name: "Point of Contact" })
    .closest("section");

  assert.ok(contactCard);
  assert.ok(
    within(contactCard).getByText("No contact information available"),
  );
  assert.equal(within(contactCard).queryAllByRole("link").length, 0);
  assert.equal(
    contactCard.querySelector(
      ".booth-request-details-modal__contact-grid",
    ),
    null,
  );
});

test("missing optional company fields open the modal with fallback values", async () => {
  const detailsWithMissingFields: BoothRequestDetailsResponse["data"] = {
    ...firstDetails,
    company: {
      ...firstDetails.company,
      description: undefined,
      logo: undefined,
      phone: undefined,
      social_links: {
        linkedin: undefined,
        website: undefined,
      },
    },
  };
  globalThis.fetch = async () => getResponse(detailsWithMissingFields);
  const view = renderHarness();

  openRequestDetails(view);
  await view.findByRole("heading", { name: "Dar Al feker" });

  const dialog = view.getByRole("dialog");
  const contactCard = view
    .getByRole("heading", { name: "Point of Contact" })
    .closest("section");
  const profileCard = view
    .getByRole("heading", { name: "Company Profile" })
    .closest("section");

  assert.ok(contactCard);
  assert.ok(profileCard);
  assert.ok(
    within(contactCard).getByText("No contact information available"),
  );
  assert.ok(within(profileCard).getByText(en.order.details.emptyValue));
  assert.equal(within(contactCard).queryAllByRole("link").length, 0);
  assert.equal(dialog.querySelector("img"), null);
  assert.ok(view.getAllByText("DA").length >= 2);
});

test("null optional display fields open the modal without a runtime exception", async () => {
  const detailsWithNullFields: BoothRequestDetailsResponse["data"] = {
    ...firstDetails,
    created_at: null,
    company: {
      ...firstDetails.company,
      description: null,
      logo: null,
      name: null,
      phone: null,
      social_links: {
        linkedin: null,
        website: null,
      },
      status: null,
    },
  };
  globalThis.fetch = async () => getResponse(detailsWithNullFields);
  const view = renderHarness();

  openRequestDetails(view);
  await view.findByRole("heading", { name: "Request Details" });

  const dialog = view.getByRole("dialog");
  const contactCard = view
    .getByRole("heading", { name: "Point of Contact" })
    .closest("section");
  const overviewCard = view
    .getByRole("heading", { name: "Request Overview" })
    .closest("section");

  assert.ok(contactCard);
  assert.ok(overviewCard);
  assert.ok(
    within(contactCard).getByText("No contact information available"),
  );
  assert.ok(
    within(overviewCard).getByText(en.order.details.emptyValue),
  );
  assert.ok(
    within(dialog).getAllByText(en.order.details.emptyValue).length >= 4,
  );
  assert.equal(dialog.querySelector("img"), null);
});

test("normalizes nullable API display fields to stable strings", () => {
  const response: BoothRequestDetailsResponse = {
    status: true,
    message: "booth request retrived successfully",
    data: {
      ...firstDetails,
      created_at: null,
      reason_for_booking: undefined,
      company: {
        ...firstDetails.company,
        business_sector: null,
        description: undefined,
        logo: null,
        name: undefined,
        phone: null,
        social_links: null,
        status: undefined,
      },
    },
  };

  const details = normalizeBoothRequestDetailsResponse(response);

  assert.equal(details.created_at, "");
  assert.equal(details.reason_for_booking, "");
  assert.equal(details.company.business_sector, "");
  assert.equal(details.company.description, "");
  assert.equal(details.company.logo, "");
  assert.equal(details.company.name, "");
  assert.equal(details.company.phone, "");
  assert.equal(details.company.social_links.linkedin, "");
  assert.equal(details.company.social_links.website, "");
  assert.equal(details.company.status, "");
});

test("normalizes relative booth company logos through the shared media resolver", () => {
  const response: BoothRequestDetailsResponse = {
    status: true,
    message: "booth request retrieved successfully",
    data: {
      ...firstDetails,
      company: {
        ...firstDetails.company,
        logo: "/storage/companies/booth-company.png",
      },
    },
  };
  const details = normalizeBoothRequestDetailsResponse(response);

  assert.equal(
    details.company.logo,
    "https://violations-salt-hybrid-springer.trycloudflare.com/storage/companies/booth-company.png",
  );

  const view = render(<CompanyAvatar company={details.company} />);
  const image = view.container.querySelector("img");
  assert.ok(image);
  assert.equal(image.src, details.company.logo);

  fireEvent.error(image);
  assert.equal(view.container.querySelector("img"), null);
  assert.ok(view.getByText("DA"));
});

test("normalizes and displays booth company gallery images", () => {
  const response: BoothRequestDetailsResponse = {
    status: true,
    message: "booth request retrieved successfully",
    data: {
      ...firstDetails,
      company: {
        ...firstDetails.company,
        gallery: [
          "/storage/companies/booth-one.png",
          { image_url: "storage/companies/booth-two.png" },
          { original_url: "https://cdn.example.com/booth-three.webp" },
          { image: "javascript:alert(1)" },
        ],
      },
    },
  };
  const details = normalizeBoothRequestDetailsResponse(response);

  assert.deepEqual(details.company.gallery, [
    `${new URL(API_BASE_URL).origin}/storage/companies/booth-one.png`,
    `${new URL(API_BASE_URL).origin}/storage/companies/booth-two.png`,
    "https://cdn.example.com/booth-three.webp",
  ]);

  const view = render(
    <I18nProvider>
      <BoothRequestDetailsModal
        approveConflict={null}
        approveConflictError=""
        approveError=""
        details={details}
        error=""
        isApproving={false}
        isLoading={false}
        isLoadingApproveConflicts={false}
        isRejecting={false}
        onApprove={() => null}
        onApproveAnyway={() => null}
        onApproveConflictPageChange={() => null}
        onClearApproveError={() => undefined}
        onClearRejectError={() => undefined}
        onClose={() => undefined}
        onCloseApproveConflict={() => undefined}
        onReject={() => null}
        onRetry={() => undefined}
        rejectError=""
      />
    </I18nProvider>,
  );
  const galleryImages = view.container.querySelectorAll(
    ".booth-request-details-modal__gallery-images img",
  );

  assert.equal(galleryImages.length, 3);
  assert.equal(galleryImages[0]?.getAttribute("src"), details.company.gallery[0]);
  assert.equal(galleryImages[1]?.getAttribute("src"), details.company.gallery[1]);
  assert.equal(galleryImages[2]?.getAttribute("src"), details.company.gallery[2]);

  fireEvent.error(galleryImages[0] as HTMLImageElement);
  assert.equal(
    view.container.querySelectorAll(
      ".booth-request-details-modal__gallery-images img",
    ).length,
    2,
  );
});

test("normalizes requested service names from the details response shapes", () => {
  const response: BoothRequestDetailsResponse = {
    status: true,
    message: "booth request retrieved successfully",
    data: {
      ...firstDetails,
      services: [
        {
          service_id: 1,
          service_name: "Power supply",
          quantity: 3,
          unit_price: 160,
          total_price: 480,
        },
        {
          id: 2,
          service: "Display screen",
        },
        {
          service: {
            data: {
              id: 3,
              name: "Extra lighting",
            },
          },
        },
        {
          id: 4,
          details: {
            name: "Storage cabinet",
          },
        },
      ],
    },
  };

  const details = normalizeBoothRequestDetailsResponse(response);

  assert.deepEqual(details.services, [
    {
      id: 1,
      name: "Power supply",
      quantity: 3,
      unit_price: 160,
      total_price: 480,
    },
    {
      id: 2,
      name: "Display screen",
      quantity: null,
      unit_price: null,
      total_price: null,
    },
    {
      id: null,
      name: "Extra lighting",
      quantity: null,
      unit_price: null,
      total_price: null,
    },
    {
      id: 4,
      name: "Storage cabinet",
      quantity: null,
      unit_price: null,
      total_price: null,
    },
  ]);
});

test("missing additional notes use the standard empty value", async () => {
  const detailsWithoutNotes: BoothRequestDetailsResponse["data"] = {
    ...firstDetails,
    reason_for_booking: undefined,
  };
  globalThis.fetch = async () => getResponse(detailsWithoutNotes);
  const view = renderHarness();

  openRequestDetails(view);
  await view.findByRole("heading", { name: "Dar Al feker" });

  const notesCard = view
    .getByRole("heading", { name: "Additional Notes" })
    .closest("section");

  assert.ok(notesCard);
  assert.ok(within(notesCard).getByText("—"));
});

test("request status and company status remain separate", async () => {
  globalThis.fetch = async () => getResponse(firstDetails);
  const view = renderHarness();

  openRequestDetails(view);
  await view.findByRole("heading", { name: "Dar Al feker" });

  const dialog = view.getByRole("dialog");
  const statusBadge = within(dialog).getByLabelText("Status: Approved");
  const profileCard = view
    .getByRole("heading", { name: "Company Profile" })
    .closest("section");

  assert.ok(profileCard);
  assert.equal(statusBadge.textContent, "Approved");
  assert.match(statusBadge.className, /--approved/);
  assert.ok(within(profileCard).getByText("Pending"));
});

test("pending request actions remain two equal-width buttons", () => {
  const view = render(
    <BoothRequestDetailsActions
      {...idleActionProps}
      requestDetails={secondDetails}
      t={en}
    />,
  );
  const footer = view.container.querySelector<HTMLElement>(
    ".booth-request-details-modal__actions--pending",
  );

  assert.ok(footer);
  const buttons = within(footer).getAllByRole("button");
  assert.equal(buttons.length, 2);
  assert.equal(buttons[0]?.textContent?.trim(), "Reject");
  assert.equal(buttons[1]?.textContent?.trim(), "Approve Request");
  assert.ok(
    buttons.every((button) =>
      button.classList.contains("booth-request-details-modal__action"),
    ),
  );
});

test("approved request actions show only one full-width final state", () => {
  const approvedDetails: BoothRequestDetailsApiData = {
    ...firstDetails,
    company: {
      ...firstDetails.company,
      status: "rejected",
    },
    status: "approved",
  };
  const view = render(
    <BoothRequestDetailsActions
      {...idleActionProps}
      requestDetails={approvedDetails}
      t={en}
    />,
  );
  const approvedState = view.getByRole("status", { name: "Approved" });

  assert.equal(view.queryByRole("button"), null);
  assert.equal(approvedState.textContent?.trim(), "Approved");
  assert.equal(approvedState.getAttribute("aria-disabled"), "true");
  assert.ok(
    approvedState.classList.contains(
      "booth-request-details-modal__action--state-approved",
    ),
  );
  assert.ok(
    approvedState.closest(
      ".booth-request-details-modal__actions--final",
    ),
  );
});

test("rejected request actions show only one full-width final state", () => {
  const rejectedDetails: BoothRequestDetailsApiData = {
    ...firstDetails,
    company: {
      ...firstDetails.company,
      status: "approved",
    },
    status: "rejected",
  };
  const view = render(
    <BoothRequestDetailsActions
      {...idleActionProps}
      requestDetails={rejectedDetails}
      t={en}
    />,
  );
  const rejectedState = view.getByRole("status", { name: "Rejected" });

  assert.equal(view.queryByRole("button"), null);
  assert.equal(rejectedState.textContent?.trim(), "Rejected");
  assert.equal(rejectedState.getAttribute("aria-disabled"), "true");
  assert.ok(
    rejectedState.classList.contains(
      "booth-request-details-modal__action--state-rejected",
    ),
  );
  assert.ok(
    rejectedState.closest(
      ".booth-request-details-modal__actions--final",
    ),
  );
});

test("approved and rejected request states never call Approve or Reject", () => {
  let approveCalls = 0;
  let rejectCalls = 0;
  const onApproveClick = () => {
    approveCalls += 1;
  };
  const onRejectClick = () => {
    rejectCalls += 1;
  };
  const view = render(
    <BoothRequestDetailsActions
      isApproving={false}
      isRejecting={false}
      onApproveClick={onApproveClick}
      onRejectClick={onRejectClick}
      requestDetails={firstDetails}
      t={en}
    />,
  );
  const approvedState = view.getByRole("status", { name: "Approved" });

  assert.equal(approvedState.onclick, null);
  fireEvent.click(approvedState);

  const rejectedDetails: BoothRequestDetailsApiData = {
    ...firstDetails,
    status: "rejected",
  };
  view.rerender(
    <BoothRequestDetailsActions
      isApproving={false}
      isRejecting={false}
      onApproveClick={onApproveClick}
      onRejectClick={onRejectClick}
      requestDetails={rejectedDetails}
      t={en}
    />,
  );
  const rejectedState = view.getByRole("status", { name: "Rejected" });

  assert.equal(rejectedState.onclick, null);
  fireEvent.click(rejectedState);
  assert.equal(approveCalls, 0);
  assert.equal(rejectCalls, 0);
});

test("empty services use the expanded centered state and logo initials", async () => {
  globalThis.fetch = async () => getResponse(firstDetails);
  const view = renderHarness();

  openRequestDetails(view);
  await view.findByRole("heading", { name: "Dar Al feker" });

  const dialog = view.getByRole("dialog");
  const servicesCard = view
    .getByRole("heading", { name: "Requested Services" })
    .closest("section");

  assert.ok(servicesCard);
  assert.ok(
    servicesCard.classList.contains(
      "booth-request-details-modal__services-card--empty",
    ),
  );
  assert.ok(
    dialog.querySelector(".booth-request-details-modal__column--main"),
  );
  assert.ok(
    dialog.querySelector(".booth-request-details-modal__column--side"),
  );
  assert.ok(
    servicesCard.querySelector(
      ".booth-request-details-modal__services-empty-icon svg",
    ),
  );
  assert.ok(view.getByText("No additional services requested"));
  assert.ok(
    view.getByText("This request includes the booth booking only."),
  );
  assert.ok(view.getAllByText("DA").length >= 2);
});

test("non-empty services render every row in the bounded rows area", async () => {
  const detailsWithServices: BoothRequestDetailsResponse["data"] = {
    ...firstDetails,
    services: [
      { service_id: 1, service_name: "Power supply" },
      { service_id: 2, service_name: "Display screen" },
      { service_id: 3, service_name: "Extra lighting" },
      { service_id: 4, service_name: "Storage cabinet" },
    ],
  };
  globalThis.fetch = async () => getResponse(detailsWithServices);
  const view = renderHarness();

  openRequestDetails(view);
  await view.findByRole("heading", { name: "Dar Al feker" });

  const servicesCard = view
    .getByRole("heading", { name: "Requested Services" })
    .closest("section");

  assert.ok(servicesCard);
  assert.equal(
    servicesCard.classList.contains(
      "booth-request-details-modal__services-card--empty",
    ),
    false,
  );
  assert.equal(within(servicesCard).getAllByRole("listitem").length, 4);
  assert.ok(
    servicesCard.querySelector(
      ".booth-request-details-modal__services-list--scrollable",
    ),
  );
  assert.ok(within(servicesCard).getByText("Power supply"));
  assert.ok(within(servicesCard).getByText("Storage cabinet"));
  assert.equal(
    within(servicesCard).queryByText("No additional services requested"),
    null,
  );
});

test("requested services render backend quantity and pricing fields", async () => {
  const detailsWithServicePricing: BoothRequestDetailsResponse["data"] = {
    ...firstDetails,
    services: [
      {
        service_id: 1,
        service_name: "Booth Design",
        quantity: 3,
        unit_price: 160,
        total_price: 480,
      },
    ],
  };
  globalThis.fetch = async () => getResponse(detailsWithServicePricing);
  const view = renderHarness();

  openRequestDetails(view);
  await view.findByRole("heading", { name: "Dar Al feker" });

  const servicesCard = view
    .getByRole("heading", { name: "Requested Services" })
    .closest("section");
  const pricing = servicesCard?.querySelector(
    ".booth-request-details-modal__service-pricing",
  );

  assert.ok(pricing);
  assert.equal(pricing.textContent, "Quantity3Unit price160Row total480");
});

test("three service rows remain content-sized without the scroll modifier", async () => {
  const detailsWithThreeServices: BoothRequestDetailsResponse["data"] = {
    ...firstDetails,
    services: [
      { service_id: 1, service_name: "Power supply" },
      { service_id: 2, service_name: "Display screen" },
      { service_id: 3, service_name: "Extra lighting" },
    ],
  };
  globalThis.fetch = async () => getResponse(detailsWithThreeServices);
  const view = renderHarness();

  openRequestDetails(view);
  await view.findByRole("heading", { name: "Dar Al feker" });

  const servicesCard = view
    .getByRole("heading", { name: "Requested Services" })
    .closest("section");

  assert.ok(servicesCard);
  assert.equal(within(servicesCard).getAllByRole("listitem").length, 3);
  assert.equal(
    servicesCard.querySelector(
      ".booth-request-details-modal__services-list--scrollable",
    ),
    null,
  );
});

test("loading and API error states keep the modal open and support retry", async () => {
  let requestCount = 0;
  const successfulResponse = getResponse(firstDetails);
  globalThis.fetch = async () => {
    requestCount += 1;

    if (requestCount === 1) {
      return new Response(JSON.stringify({ message: "Details unavailable." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return successfulResponse;
  };
  const view = renderHarness();

  openRequestDetails(view);

  assert.ok(view.getByRole("dialog"));
  assert.ok(view.getByRole("status"));
  assert.ok(await view.findByRole("alert"));
  assert.ok(view.getByText("Details unavailable."));

  fireEvent.click(view.getByRole("button", { name: "Try again" }));

  await view.findByRole("heading", { name: "Dar Al feker" });
  assert.equal(requestCount, 2);
});

test("changing selection never displays stale request details", async () => {
  const firstDeferred = createDeferred<Response>();
  const secondDeferred = createDeferred<Response>();
  globalThis.fetch = async (input) =>
    getRequestedUrl(input).endsWith("/901")
      ? firstDeferred.promise
      : secondDeferred.promise;
  const view = renderHarness([firstRequest, secondRequest]);

  openRequestDetails(view, 37);
  openRequestDetails(view, 52);

  await act(async () => {
    firstDeferred.resolve(getResponse(firstDetails));
    await firstDeferred.promise;
  });

  assert.equal(view.queryByText("Dar Al feker"), null);
  assert.ok(view.getByRole("status"));

  await act(async () => {
    secondDeferred.resolve(getResponse(secondDetails));
    await secondDeferred.promise;
  });

  await view.findByRole("heading", { name: "Second Company" });
  assert.equal(view.queryByText("Dar Al feker"), null);
});

test("closing during a request prevents late details from reopening the modal", async () => {
  const deferredResponse = createDeferred<Response>();
  globalThis.fetch = async () => deferredResponse.promise;
  const view = renderHarness();

  openRequestDetails(view);
  fireEvent.click(view.getByRole("button", { name: "Close request details" }));

  await act(async () => {
    deferredResponse.resolve(getResponse(firstDetails));
    await deferredResponse.promise;
  });

  assert.equal(view.queryByRole("dialog"), null);
  assert.equal(view.queryByText("Dar Al feker"), null);
});

test("Reject confirmation defers the API call and prevents duplicate submissions", async () => {
  const rejectDeferred = createDeferred<Response>();
  const rejectPaths: string[] = [];
  globalThis.fetch = async (input, init) => {
    if (init?.method === "PATCH") {
      rejectPaths.push(new URL(getRequestedUrl(input)).pathname);
      return rejectDeferred.promise;
    }

    return getResponse(secondDetails);
  };
  const view = renderHarness([secondRequest]);

  openRequestDetails(view, 52);
  await view.findByRole("heading", { name: "Second Company" });
  fireEvent.click(view.getByRole("button", { name: "Reject" }));

  const confirmation = view.getByRole("alertdialog", {
    name: "Reject booth request?",
  });
  const confirmButton = within(confirmation).getByRole("button", {
    name: "Reject Request",
  });

  assert.equal(rejectPaths.length, 0);
  assert.match(confirmation.textContent ?? "", /Request ID#902/);
  fireEvent.click(confirmButton);

  const rejectingButton = await view.findByRole("button", {
    name: "Rejecting…",
  });
  const cancelButton = within(confirmation).getByRole("button", {
    name: "Cancel",
  });
  const approveButton = view.container.querySelector<HTMLButtonElement>(
    ".booth-request-details-modal__action--approve",
  );

  assert.equal(rejectingButton.hasAttribute("disabled"), true);
  assert.equal(cancelButton.hasAttribute("disabled"), true);
  assert.equal(approveButton?.hasAttribute("disabled"), true);
  assert.deepEqual(rejectPaths, [
    "/api/v1/admin/booths/requests/reject/902",
  ]);

  fireEvent.click(rejectingButton);
  fireEvent.click(cancelButton);
  fireEvent.keyDown(document, { key: "Escape" });
  fireEvent.mouseDown(
    view.container.querySelector(
      ".reject-booth-request-confirm-modal",
    )!,
  );
  assert.equal(rejectPaths.length, 1);
  assert.ok(view.getByRole("alertdialog"));

  await act(async () => {
    rejectDeferred.resolve(getRejectResponse());
    await rejectDeferred.promise;
  });

  await waitFor(() => {
    assert.equal(
      view.getByRole("button", { name: "Reject" }).hasAttribute("disabled"),
      false,
    );
  });
  assert.equal(view.queryByRole("alertdialog"), null);
  assert.equal(rejectPaths.length, 1);
});

test("Cancel, backdrop, and Escape close only the Reject confirmation", async () => {
  let rejectRequests = 0;
  globalThis.fetch = async (_input, init) => {
    if (init?.method === "PATCH") {
      rejectRequests += 1;
      return getRejectResponse();
    }

    return getResponse(secondDetails);
  };
  const view = renderHarness([secondRequest]);

  openRequestDetails(view, 52);
  await view.findByRole("heading", { name: "Second Company" });
  const rejectButton = view.getByRole("button", { name: "Reject" });

  rejectButton.focus();
  fireEvent.click(rejectButton);

  const cancelButton = view.getByRole("button", { name: "Cancel" });
  assert.equal(document.activeElement, cancelButton);
  assert.equal(document.body.style.overflow, "hidden");
  assert.equal(
    view.getByRole("dialog", { hidden: true }).hasAttribute("inert"),
    true,
  );

  fireEvent.click(cancelButton);
  assert.equal(view.queryByRole("alertdialog"), null);
  assert.ok(view.getByRole("dialog"));
  assert.equal(document.activeElement, rejectButton);
  assert.equal(document.body.style.overflow, "hidden");

  fireEvent.click(rejectButton);
  fireEvent.mouseDown(
    view.container.querySelector(
      ".reject-booth-request-confirm-modal",
    )!,
  );
  assert.equal(view.queryByRole("alertdialog"), null);
  assert.ok(view.getByRole("dialog"));

  fireEvent.click(rejectButton);
  fireEvent.keyDown(document, { key: "Escape" });
  assert.equal(view.queryByRole("alertdialog"), null);
  assert.ok(view.getByRole("dialog"));
  assert.equal(rejectRequests, 0);
});

test("Reject confirmation traps focus and starts on the safe action", async () => {
  globalThis.fetch = async () => getResponse(secondDetails);
  const view = renderHarness([secondRequest]);

  openRequestDetails(view, 52);
  await view.findByRole("heading", { name: "Second Company" });
  fireEvent.click(view.getByRole("button", { name: "Reject" }));

  const confirmation = view.getByRole("alertdialog");
  const cancelButton = within(confirmation).getByRole("button", {
    name: "Cancel",
  });
  const confirmButton = within(confirmation).getByRole("button", {
    name: "Reject Request",
  });

  assert.equal(document.activeElement, cancelButton);

  confirmButton.focus();
  fireEvent.keyDown(document, { key: "Tab" });
  assert.equal(document.activeElement, cancelButton);

  cancelButton.focus();
  fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
  assert.equal(document.activeElement, confirmButton);
});

test("changing the selected request or status closes Reject confirmation", () => {
  const sharedProps = {
    approveConflict: null,
    approveConflictError: "",
    approveError: "",
    error: "",
    isApproving: false,
    isLoading: false,
    isLoadingApproveConflicts: false,
    isRejecting: false,
    onApprove: () => approveSuccessResult,
    onApproveAnyway: () => approveSuccessResult,
    onApproveConflictPageChange: () => null,
    onClearApproveError: () => undefined,
    onClearRejectError: () => undefined,
    onClose: () => undefined,
    onCloseApproveConflict: () => undefined,
    onReject: () => rejectSuccessResponse,
    onRetry: () => undefined,
    rejectError: "",
  };
  const view = render(
    <I18nProvider>
      <BoothRequestDetailsModal {...sharedProps} details={secondDetails} />
    </I18nProvider>,
  );

  fireEvent.click(view.getByRole("button", { name: "Reject" }));
  assert.ok(view.getByRole("alertdialog"));

  const anotherPendingRequest = { ...secondDetails, id: 903 };
  view.rerender(
    <I18nProvider>
      <BoothRequestDetailsModal
        {...sharedProps}
        details={anotherPendingRequest}
      />
    </I18nProvider>,
  );
  assert.equal(view.queryByRole("alertdialog"), null);

  fireEvent.click(view.getByRole("button", { name: "Reject" }));
  assert.ok(view.getByRole("alertdialog"));

  view.rerender(
    <I18nProvider>
      <BoothRequestDetailsModal
        {...sharedProps}
        details={{ ...anotherPendingRequest, status: "rejected" }}
      />
    </I18nProvider>,
  );
  assert.equal(view.queryByRole("alertdialog"), null);
  assert.equal(view.queryByRole("button", { name: "Reject" }), null);
});

test("Reject confirmation renders localized English and Arabic text", () => {
  window.localStorage.setItem("ems-language", "en");
  const englishView = render(
    <I18nProvider>
      <RejectBoothRequestConfirmModal
        error=""
        isRejecting={false}
        onCancel={() => undefined}
        onConfirm={() => undefined}
        requestId={902}
      />
    </I18nProvider>,
  );

  assert.ok(
    englishView.getByRole("alertdialog", {
      name: en.order.rejectConfirmation.title,
    }),
  );
  assert.ok(englishView.getByText(en.order.rejectConfirmation.message));
  assert.ok(
    englishView.getByRole("button", {
      name: en.order.rejectConfirmation.confirm,
    }),
  );

  englishView.unmount();
  window.localStorage.setItem("ems-language", "ar");

  const arabicView = render(
    <I18nProvider>
      <RejectBoothRequestConfirmModal
        error=""
        isRejecting={false}
        onCancel={() => undefined}
        onConfirm={() => undefined}
        requestId={902}
      />
    </I18nProvider>,
  );

  assert.ok(
    arabicView.getByRole("alertdialog", {
      name: ar.order.rejectConfirmation.title,
    }),
  );
  assert.ok(arabicView.getByText(ar.order.rejectConfirmation.message));
  assert.ok(
    arabicView.getByRole("button", {
      name: ar.order.rejectConfirmation.confirm,
    }),
  );
});

test("Reject errors keep the modal open and re-enable both actions", async () => {
  globalThis.fetch = async (_input, init) => {
    if (init?.method === "PATCH") {
      return new Response(
        JSON.stringify({ message: "Request can no longer be rejected." }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return getResponse(secondDetails);
  };
  const view = renderHarness([secondRequest]);

  openRequestDetails(view, 52);
  await view.findByRole("heading", { name: "Second Company" });
  fireEvent.click(view.getByRole("button", { name: "Reject" }));
  fireEvent.click(
    view.getByRole("button", { name: "Reject Request" }),
  );

  assert.equal(
    (await view.findByRole("alert")).textContent,
    "Request can no longer be rejected.",
  );
  const confirmation = view.getByRole("alertdialog");
  const cancelButton = within(confirmation).getByRole("button", {
    name: "Cancel",
  });

  assert.ok(view.getByRole("dialog", { hidden: true }));
  assert.ok(confirmation);
  assert.equal(
    within(confirmation)
      .getByRole("button", { name: "Reject Request" })
      .hasAttribute("disabled"),
    false,
  );
  assert.equal(
    cancelButton.hasAttribute("disabled"),
    false,
  );
  assert.equal(document.activeElement, cancelButton);
  assert.equal(view.queryByRole("status", { name: "Rejected" }), null);
});

test("successful Reject refreshes details, Orders, and statistics", async () => {
  let detailsRequests = 0;
  let listRequests = 0;
  let rejectRequests = 0;
  let statisticsRequests = 0;

  globalThis.fetch = async (input, init) => {
    const url = new URL(getRequestedUrl(input));

    if (url.pathname.endsWith("/booths/requests/reject/902")) {
      rejectRequests += 1;
      assert.equal(init?.method, "PATCH");
      return getRejectResponse();
    }

    if (url.pathname.endsWith("/booths/requests/902")) {
      detailsRequests += 1;
      return getResponse(
        detailsRequests === 1
          ? secondDetails
          : { ...secondDetails, status: "rejected" },
      );
    }

    throw new Error(`Unexpected request: ${url.pathname}`);
  };

  const view = renderHarness([secondRequest], {
    onListRefresh: () => {
      listRequests += 1;
    },
    onStatisticsRefresh: () => {
      statisticsRequests += 1;
    },
  });

  openRequestDetails(view, 52);
  await view.findByRole("heading", { name: "Second Company" });
  fireEvent.click(view.getByRole("button", { name: "Reject" }));
  fireEvent.click(
    view.getByRole("button", { name: "Reject Request" }),
  );

  assert.ok(await view.findByRole("status", { name: "Rejected" }));
  assert.ok(view.getByRole("dialog"));
  assert.equal(view.queryByRole("alertdialog"), null);
  assert.equal(rejectRequests, 1);
  assert.equal(detailsRequests, 2);
  assert.equal(listRequests, 1);
  assert.equal(statisticsRequests, 1);
});

test("Approve confirmation defers submission and prevents duplicates", async () => {
  const approveDeferred = createDeferred<Response>();
  const approveRequests: Array<{ body: string; path: string }> = [];
  globalThis.fetch = async (input, init) => {
    if (init?.method === "POST") {
      approveRequests.push({
        body: String(init.body),
        path: new URL(getRequestedUrl(input)).pathname,
      });
      return approveDeferred.promise;
    }

    return getResponse(secondDetails);
  };
  const view = renderHarness([secondRequest]);

  openRequestDetails(view, 52);
  await view.findByRole("heading", { name: "Second Company" });
  fireEvent.click(view.getByRole("button", { name: "Approve Request" }));

  const confirmation = view.getByRole("alertdialog", {
    name: en.order.approveConfirmation.title,
  });
  const confirmButton = within(confirmation).getByRole("button", {
    name: en.order.approveConfirmation.confirm,
  });

  assert.equal(approveRequests.length, 0);
  assert.match(confirmation.textContent ?? "", /Request ID#902/);
  fireEvent.click(confirmButton);

  const approvingButton = await view.findByRole("button", {
    name: en.order.approveConfirmation.approving,
  });
  const cancelButton = within(confirmation).getByRole("button", {
    name: "Cancel",
  });
  const rejectButton = view.container.querySelector<HTMLButtonElement>(
    ".booth-request-details-modal__action--reject",
  );

  assert.equal(approvingButton.hasAttribute("disabled"), true);
  assert.equal(cancelButton.hasAttribute("disabled"), true);
  assert.equal(rejectButton?.hasAttribute("disabled"), true);
  assert.deepEqual(approveRequests, [
    {
      body: JSON.stringify({ force: false }),
      path: "/api/v1/admin/booths/requests/approve/902",
    },
  ]);

  fireEvent.click(approvingButton);
  fireEvent.click(cancelButton);
  fireEvent.keyDown(document, { key: "Escape" });
  fireEvent.mouseDown(
    view.container.querySelector(
      ".approve-booth-request-confirm-modal",
    )!,
  );
  assert.equal(approveRequests.length, 1);
  assert.ok(view.getByRole("alertdialog"));

  await act(async () => {
    approveDeferred.resolve(getApproveResponse());
    await approveDeferred.promise;
  });

  await waitFor(() => assert.equal(view.queryByRole("alertdialog"), null));
  assert.equal(approveRequests.length, 1);
});

test("Approve confirmation preserves nested-modal focus and cancellation", async () => {
  let approveRequests = 0;
  globalThis.fetch = async (_input, init) => {
    if (init?.method === "POST") {
      approveRequests += 1;
      return getApproveResponse();
    }

    return getResponse(secondDetails);
  };
  const view = renderHarness([secondRequest]);

  openRequestDetails(view, 52);
  await view.findByRole("heading", { name: "Second Company" });
  const approveButton = view.getByRole("button", { name: "Approve Request" });

  approveButton.focus();
  fireEvent.click(approveButton);

  const confirmation = view.getByRole("alertdialog");
  const cancelButton = within(confirmation).getByRole("button", {
    name: "Cancel",
  });
  const confirmButton = within(confirmation).getByRole("button", {
    name: en.order.approveConfirmation.confirm,
  });

  assert.equal(document.activeElement, cancelButton);
  assert.equal(document.body.style.overflow, "hidden");
  assert.equal(
    view.getByRole("dialog", { hidden: true }).hasAttribute("inert"),
    true,
  );

  confirmButton.focus();
  fireEvent.keyDown(document, { key: "Tab" });
  assert.equal(document.activeElement, cancelButton);

  cancelButton.focus();
  fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
  assert.equal(document.activeElement, confirmButton);

  fireEvent.click(cancelButton);
  assert.equal(view.queryByRole("alertdialog"), null);
  assert.ok(view.getByRole("dialog"));
  assert.equal(document.activeElement, approveButton);

  fireEvent.click(approveButton);
  fireEvent.mouseDown(
    view.container.querySelector(
      ".approve-booth-request-confirm-modal",
    )!,
  );
  assert.equal(view.queryByRole("alertdialog"), null);

  fireEvent.click(approveButton);
  fireEvent.keyDown(document, { key: "Escape" });
  assert.equal(view.queryByRole("alertdialog"), null);
  assert.ok(view.getByRole("dialog"));
  assert.equal(approveRequests, 0);
});

test("Approve failures keep confirmation open and preserve pending status", async () => {
  let detailsRequests = 0;
  let listRefreshes = 0;
  let statisticsRefreshes = 0;
  globalThis.fetch = async (_input, init) => {
    if (init?.method === "POST") {
      return new Response(
        JSON.stringify({
          status: false,
          message: "Booth is no longer available.",
          data: null,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    detailsRequests += 1;
    return getResponse(secondDetails);
  };
  const view = renderHarness([secondRequest], {
    onListRefresh: () => {
      listRefreshes += 1;
    },
    onStatisticsRefresh: () => {
      statisticsRefreshes += 1;
    },
  });

  openRequestDetails(view, 52);
  await view.findByRole("heading", { name: "Second Company" });
  fireEvent.click(view.getByRole("button", { name: "Approve Request" }));
  fireEvent.click(
    view.getByRole("button", {
      name: en.order.approveConfirmation.confirm,
    }),
  );

  assert.equal(
    (await view.findByRole("alert")).textContent,
    "Booth is no longer available.",
  );
  const confirmation = view.getByRole("alertdialog");
  assert.equal(
    within(confirmation)
      .getByRole("button", { name: en.order.approveConfirmation.confirm })
      .hasAttribute("disabled"),
    false,
  );
  assert.equal(
    within(confirmation)
      .getByRole("button", { name: "Cancel" })
      .hasAttribute("disabled"),
    false,
  );
  assert.equal(view.queryByRole("status", { name: "Approved" }), null);
  assert.equal(detailsRequests, 1);
  assert.equal(listRefreshes, 0);
  assert.equal(statisticsRefreshes, 0);
});

test("successful Approve refreshes details, Orders, and statistics", async () => {
  let approveRequests = 0;
  let detailsRequests = 0;
  let listRequests = 0;
  let statisticsRequests = 0;

  globalThis.fetch = async (input, init) => {
    const url = new URL(getRequestedUrl(input));

    if (url.pathname.endsWith("/booths/requests/approve/902")) {
      approveRequests += 1;
      assert.equal(init?.method, "POST");
      assert.deepEqual(JSON.parse(String(init?.body)), { force: false });
      return getApproveResponse();
    }

    if (url.pathname.endsWith("/booths/requests/902")) {
      detailsRequests += 1;
      return getResponse(
        detailsRequests === 1
          ? secondDetails
          : { ...secondDetails, status: "approved" },
      );
    }

    throw new Error(`Unexpected request: ${url.pathname}`);
  };

  const view = renderHarness([secondRequest], {
    onListRefresh: () => {
      listRequests += 1;
    },
    onStatisticsRefresh: () => {
      statisticsRequests += 1;
    },
  });

  openRequestDetails(view, 52);
  await view.findByRole("heading", { name: "Second Company" });
  fireEvent.click(view.getByRole("button", { name: "Approve Request" }));
  fireEvent.click(
    view.getByRole("button", {
      name: en.order.approveConfirmation.confirm,
    }),
  );

  assert.ok(await view.findByRole("status", { name: "Approved" }));
  assert.ok(view.getByRole("dialog"));
  assert.equal(view.queryByRole("alertdialog"), null);
  assert.equal(approveRequests, 1);
  assert.equal(detailsRequests, 2);
  assert.equal(listRequests, 1);
  assert.equal(statisticsRequests, 1);
});

test("valid Approve conflicts show returned requests and require explicit forced approval", async () => {
  const approveBodies: Array<{ force: boolean }> = [];
  globalThis.fetch = async (_input, init) => {
    if (init?.method === "POST") {
      const body = JSON.parse(String(init.body)) as { force: boolean };
      approveBodies.push(body);
      return getApproveConflictResponse();
    }

    return getResponse(secondDetails);
  };
  const view = renderHarness([secondRequest]);

  openRequestDetails(view, 52);
  await view.findByRole("heading", { name: "Second Company" });
  const approveButton = view.getByRole("button", { name: "Approve Request" });
  approveButton.focus();
  fireEvent.click(approveButton);
  fireEvent.click(
    view.getByRole("button", {
      name: en.order.approveConfirmation.confirm,
    }),
  );

  const conflictModal = await view.findByRole("alertdialog", {
    name: en.order.approveConflict.title,
  });
  assert.match(
    conflictModal.textContent ?? "",
    /Other pending requests exist for this booth/,
  );
  assert.ok(within(conflictModal).getByText("2 conflicting requests"));
  assert.ok(within(conflictModal).getByText("#5"));
  assert.ok(within(conflictModal).getByText("#6"));
  assert.ok(within(conflictModal).getByText("160"));
  assert.ok(within(conflictModal).getByText("—"));
  assert.deepEqual(approveBodies, [{ force: false }]);

  const cancelButton = within(conflictModal).getByRole("button", {
    name: "Cancel",
  });
  assert.equal(document.activeElement, cancelButton);
  assert.equal(
    view.getByRole("dialog", { hidden: true }).hasAttribute("inert"),
    true,
  );

  fireEvent.click(cancelButton);
  assert.equal(view.queryByRole("alertdialog"), null);
  assert.equal(document.activeElement, approveButton);
  assert.deepEqual(approveBodies, [{ force: false }]);

  fireEvent.click(approveButton);
  fireEvent.click(
    view.getByRole("button", {
      name: en.order.approveConfirmation.confirm,
    }),
  );
  await view.findByRole("alertdialog", {
    name: en.order.approveConflict.title,
  });
  fireEvent.keyDown(document, { key: "Escape" });
  assert.equal(view.queryByRole("alertdialog"), null);
  assert.equal(document.activeElement, approveButton);

  fireEvent.click(approveButton);
  fireEvent.click(
    view.getByRole("button", {
      name: en.order.approveConfirmation.confirm,
    }),
  );
  await view.findByRole("alertdialog", {
    name: en.order.approveConflict.title,
  });
  fireEvent.mouseDown(
    view.container.querySelector(
      ".approve-booth-request-conflict-modal",
    )!,
  );
  assert.equal(view.queryByRole("alertdialog"), null);
  assert.equal(document.activeElement, approveButton);
  assert.deepEqual(approveBodies, [
    { force: false },
    { force: false },
    { force: false },
  ]);
});

test("forced Approve submits once and refreshes details, Orders, and statistics", async () => {
  const forcedApprove = createDeferred<Response>();
  const approveBodies: Array<{ force: boolean }> = [];
  let detailsRequests = 0;
  let listRefreshes = 0;
  let statisticsRefreshes = 0;
  globalThis.fetch = async (input, init) => {
    const url = new URL(getRequestedUrl(input));

    if (url.pathname.endsWith("/booths/requests/approve/902")) {
      const body = JSON.parse(String(init?.body)) as { force: boolean };
      approveBodies.push(body);
      return body.force
        ? forcedApprove.promise
        : getApproveConflictResponse();
    }

    if (url.pathname.endsWith("/booths/requests/902")) {
      detailsRequests += 1;
      return getResponse(
        detailsRequests === 1
          ? secondDetails
          : { ...secondDetails, status: "approved" },
      );
    }

    throw new Error(`Unexpected request: ${url.pathname}`);
  };
  const view = renderHarness([secondRequest], {
    onListRefresh: () => {
      listRefreshes += 1;
    },
    onStatisticsRefresh: () => {
      statisticsRefreshes += 1;
    },
  });

  openRequestDetails(view, 52);
  await view.findByRole("heading", { name: "Second Company" });
  fireEvent.click(view.getByRole("button", { name: "Approve Request" }));
  fireEvent.click(
    view.getByRole("button", {
      name: en.order.approveConfirmation.confirm,
    }),
  );
  const conflictModal = await view.findByRole("alertdialog", {
    name: en.order.approveConflict.title,
  });
  const approveAnywayButton = within(conflictModal).getByRole("button", {
    name: en.order.approveConflict.approveAnyway,
  });
  fireEvent.click(approveAnywayButton);

  const approvingButton = within(conflictModal).getByRole("button", {
    name: en.order.approveConflict.approving,
  });
  const cancelButton = within(conflictModal).getByRole("button", {
    name: "Cancel",
  });
  assert.equal(approvingButton.hasAttribute("disabled"), true);
  assert.equal(cancelButton.hasAttribute("disabled"), true);
  fireEvent.click(approvingButton);
  fireEvent.click(cancelButton);
  fireEvent.keyDown(document, { key: "Escape" });
  assert.deepEqual(approveBodies, [{ force: false }, { force: true }]);
  assert.ok(
    view.getByRole("alertdialog", {
      name: en.order.approveConflict.title,
    }),
  );

  await act(async () => {
    forcedApprove.resolve(getApproveResponse());
    await forcedApprove.promise;
  });

  assert.ok(await view.findByRole("status", { name: "Approved" }));
  assert.equal(view.queryByRole("alertdialog"), null);
  assert.equal(detailsRequests, 2);
  assert.equal(listRefreshes, 1);
  assert.equal(statisticsRefreshes, 1);
});

test("failed forced Approve keeps the conflict modal open with an accessible error", async () => {
  let approveRequests = 0;
  let listRefreshes = 0;
  let statisticsRefreshes = 0;
  globalThis.fetch = async (_input, init) => {
    if (init?.method === "POST") {
      approveRequests += 1;

      return approveRequests === 1
        ? getApproveConflictResponse()
        : new Response(
            JSON.stringify({ message: "Unable to force this approval." }),
            {
              status: 422,
              headers: { "Content-Type": "application/json" },
            },
          );
    }

    return getResponse(secondDetails);
  };
  const view = renderHarness([secondRequest], {
    onListRefresh: () => {
      listRefreshes += 1;
    },
    onStatisticsRefresh: () => {
      statisticsRefreshes += 1;
    },
  });

  openRequestDetails(view, 52);
  await view.findByRole("heading", { name: "Second Company" });
  fireEvent.click(view.getByRole("button", { name: "Approve Request" }));
  fireEvent.click(
    view.getByRole("button", {
      name: en.order.approveConfirmation.confirm,
    }),
  );
  const conflictModal = await view.findByRole("alertdialog", {
    name: en.order.approveConflict.title,
  });
  fireEvent.click(
    within(conflictModal).getByRole("button", {
      name: en.order.approveConflict.approveAnyway,
    }),
  );

  assert.equal(
    (await within(conflictModal).findByRole("alert")).textContent,
    "Unable to force this approval.",
  );
  assert.ok(
    view.getByRole("alertdialog", {
      name: en.order.approveConflict.title,
    }),
  );
  assert.equal(approveRequests, 2);
  assert.equal(listRefreshes, 0);
  assert.equal(statisticsRefreshes, 0);
  assert.equal(view.queryByRole("status", { name: "Approved" }), null);
});

test("conflict pagination requests force false with the selected page", async () => {
  const secondPage = createDeferred<Response>();
  const approvalRequests: Array<{ force: boolean; page: string | null }> = [];
  globalThis.fetch = async (input, init) => {
    if (init?.method === "POST") {
      const url = new URL(getRequestedUrl(input));
      const body = JSON.parse(String(init.body)) as { force: boolean };
      approvalRequests.push({
        force: body.force,
        page: url.searchParams.get("page"),
      });

      return approvalRequests.length === 1
        ? getApproveConflictResponse({
            lastPage: 2,
            requests: [
              {
                id: 5,
                booth_id: 12,
                company_id: 37,
                status: "pending",
                final_price: 160,
              },
            ],
            total: 4,
          })
        : secondPage.promise;
    }

    return getResponse(secondDetails);
  };
  const view = renderHarness([secondRequest]);

  openRequestDetails(view, 52);
  await view.findByRole("heading", { name: "Second Company" });
  fireEvent.click(view.getByRole("button", { name: "Approve Request" }));
  fireEvent.click(
    view.getByRole("button", {
      name: en.order.approveConfirmation.confirm,
    }),
  );
  const conflictModal = await view.findByRole("alertdialog", {
    name: en.order.approveConflict.title,
  });
  assert.ok(within(conflictModal).getByText("#5"));
  fireEvent.click(within(conflictModal).getByRole("button", { name: "2" }));

  assert.deepEqual(approvalRequests, [
    { force: false, page: null },
    { force: false, page: "2" },
  ]);
  assert.ok(within(conflictModal).getByText("#5"));
  assert.equal(
    within(conflictModal).getByRole("status").textContent,
    en.order.approveConflict.loading,
  );

  await act(async () => {
    secondPage.resolve(
      getApproveConflictResponse({
        currentPage: 2,
        lastPage: 2,
        requests: [
          {
            id: 8,
            booth_id: 12,
            company_id: 61,
            status: "pending",
            final_price: 200,
          },
        ],
        total: 4,
      }),
    );
    await secondPage.promise;
  });

  assert.ok(await within(conflictModal).findByText("#8"));
  assert.equal(within(conflictModal).queryByText("#5"), null);
});

test("Approve confirmation renders localized English and Arabic text", () => {
  window.localStorage.setItem("ems-language", "en");
  const englishView = render(
    <I18nProvider>
      <ApproveBoothRequestConfirmModal
        error=""
        isApproving={false}
        onCancel={() => undefined}
        onConfirm={() => undefined}
        requestId={902}
      />
    </I18nProvider>,
  );

  assert.ok(
    englishView.getByRole("alertdialog", {
      name: en.order.approveConfirmation.title,
    }),
  );
  assert.ok(englishView.getByText(en.order.approveConfirmation.message));

  englishView.unmount();
  window.localStorage.setItem("ems-language", "ar");

  const arabicView = render(
    <I18nProvider>
      <ApproveBoothRequestConfirmModal
        error=""
        isApproving={false}
        onCancel={() => undefined}
        onConfirm={() => undefined}
        requestId={902}
      />
    </I18nProvider>,
  );

  assert.ok(
    arabicView.getByRole("alertdialog", {
      name: ar.order.approveConfirmation.title,
    }),
  );
  assert.ok(arabicView.getByText(ar.order.approveConfirmation.message));
});

test("the close, Escape, and backdrop interactions remain available", async () => {
  globalThis.fetch = async () => getResponse(firstDetails);
  const view = renderHarness();

  openRequestDetails(view);
  await view.findByRole("heading", { name: "Dar Al feker" });
  fireEvent.keyDown(document, { key: "Escape" });
  assert.equal(view.queryByRole("dialog"), null);

  openRequestDetails(view);
  await view.findByRole("heading", { name: "Dar Al feker" });
  fireEvent.mouseDown(view.getByRole("presentation"));
  assert.equal(view.queryByRole("dialog"), null);

  openRequestDetails(view);
  await view.findByRole("heading", { name: "Dar Al feker" });
  fireEvent.click(view.getByRole("button", { name: "Close request details" }));
  assert.equal(view.queryByRole("dialog"), null);
});

test("the details endpoint builder uses only the request id", async () => {
  const { buildBoothRequestDetailsPath } = await import(
    "../src/features/order/api/boothRequestDetailsApi.js"
  );

  assert.equal(buildBoothRequestDetailsPath(901), "booths/requests/901");
  assert.throws(() => buildBoothRequestDetailsPath(0));
});
