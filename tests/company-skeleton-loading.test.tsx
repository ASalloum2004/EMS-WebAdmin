import "./setup-dom.js";
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { cleanup, render, within } from "@testing-library/react";
import { Skeleton } from "../src/components/Skeleton/Skeleton.js";
import { CompanyDetailsModal } from "../src/features/company/components/CompanyDetailsModal/CompanyDetailsModal.js";
import { ManagerDetailsModal } from "../src/features/company/components/ManagerDetailsModal/ManagerDetailsModal.js";
import {
  CompanyListSkeleton,
  DirectoryCardsSkeleton,
  ManagerListSkeleton,
} from "../src/features/company/components/skeletons/index.js";
import type {
  CompanyDetailsState,
  CompanyListItem,
  ManagerDetailsState,
  ManagerListItem,
} from "../src/features/company/types.js";
import { I18nProvider } from "../src/i18n/I18nContext.js";

const company: CompanyListItem = {
  boothsCount: 2,
  businessSector: "Technology",
  id: 7,
  logo: null,
  managersCount: 3,
  name: "Skeleton Systems",
  phone: "+963111111111",
  status: "approved",
};

const manager: ManagerListItem = {
  avatar: null,
  boothsCount: 4,
  companiesCount: 2,
  email: "manager@example.com",
  internalId: 9,
  name: "Loading Manager",
};

const loadingCompanyDetails: CompanyDetailsState = {
  details: null,
  error: "",
  isLoading: true,
};

const loadingManagerDetails: ManagerDetailsState = {
  details: null,
  error: "",
  isLoading: true,
};

beforeEach(() => {
  window.localStorage.setItem("ems-language", "en");
});

afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
  window.localStorage.clear();
});

test("shared Skeleton applies typed dimensions and remains decorative", () => {
  const view = render(
    <Skeleton
      borderRadius={10}
      className="custom-skeleton"
      height="2rem"
      variant="pill"
      width={120}
    />,
  );
  const skeleton = view.container.querySelector<HTMLElement>(".skeleton");

  assert.ok(skeleton);
  assert.equal(skeleton.getAttribute("aria-hidden"), "true");
  assert.ok(skeleton.classList.contains("skeleton--pill"));
  assert.ok(skeleton.classList.contains("custom-skeleton"));
  assert.equal(skeleton.style.getPropertyValue("--skeleton-width"), "120px");
  assert.equal(skeleton.style.getPropertyValue("--skeleton-height"), "2rem");
  assert.equal(
    skeleton.style.getPropertyValue("--skeleton-border-radius"),
    "10px",
  );
});

test("company and manager row skeletons preserve their real column contracts", () => {
  const companyView = render(
    <I18nProvider>
      <CompanyListSkeleton />
    </I18nProvider>,
  );

  assert.equal(
    companyView.container.querySelectorAll(
      ".company-list-skeleton .data-table__row",
    ).length,
    5,
  );
  assert.equal(
    companyView.container.querySelectorAll(
      ".company-list-skeleton .company-table__cell--status",
    ).length,
    5,
  );
  assert.equal(
    companyView.getByRole("status").textContent,
    "Loading companies...",
  );
  companyView.unmount();

  const managerView = render(
    <I18nProvider>
      <ManagerListSkeleton />
    </I18nProvider>,
  );

  assert.equal(
    managerView.container.querySelectorAll(
      ".manager-list-skeleton .data-table__row",
    ).length,
    5,
  );
  assert.equal(
    managerView.container.querySelectorAll(
      ".manager-list-skeleton .manager-table__cell--count",
    ).length,
    10,
  );
  assert.equal(managerView.queryByText("Actions"), null);
  assert.equal(
    managerView.getByRole("status").textContent,
    "Loading managers...",
  );
});

test("manager directory loading uses three stable card shells without mock values", () => {
  const view = render(
    <I18nProvider>
      <DirectoryCardsSkeleton />
    </I18nProvider>,
  );
  const region = view.container.querySelector<HTMLElement>(
    ".manager-summary",
  );

  assert.ok(region);
  assert.equal(region.getAttribute("aria-busy"), "true");
  assert.equal(region.querySelectorAll(".card").length, 3);
  assert.equal(region.textContent?.trim(), "Loading manager statistics");
  assert.equal(
    view.getByRole("status").textContent,
    "Loading manager statistics",
  );
});

test("company and manager modal shells expose only their own detail skeleton", () => {
  const companyView = render(
    <I18nProvider>
      <CompanyDetailsModal
        company={company}
        detailsState={loadingCompanyDetails}
        onClose={() => undefined}
        onRetry={() => undefined}
      />
    </I18nProvider>,
  );
  const companyDialog = companyView.getByRole("dialog", {
    name: "Company details",
  });

  assert.equal(companyDialog.getAttribute("aria-busy"), "true");
  assert.ok(within(companyDialog).getByText("Skeleton Systems"));
  assert.ok(
    companyDialog.querySelector(".company-details-skeleton"),
  );
  assert.equal(
    within(companyDialog).queryByText("No managers available."),
    null,
  );
  companyView.unmount();

  const managerView = render(
    <I18nProvider>
      <ManagerDetailsModal
        detailsState={loadingManagerDetails}
        manager={manager}
        onClose={() => undefined}
        onRetry={() => undefined}
      />
    </I18nProvider>,
  );
  const managerDialog = managerView.getByRole("dialog", {
    name: "Manager details",
  });

  assert.equal(managerDialog.getAttribute("aria-busy"), "true");
  assert.ok(within(managerDialog).getByText("Loading Manager"));
  assert.ok(
    managerDialog.querySelector(".manager-details-skeleton"),
  );
  assert.equal(within(managerDialog).queryByText("4"), null);
  assert.equal(within(managerDialog).queryByText("2"), null);
  assert.equal(
    managerDialog.querySelectorAll(
      ".manager-details-skeleton__portfolio-card",
    ).length,
    2,
  );
});
