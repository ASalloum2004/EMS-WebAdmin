import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import type { ReactNode } from "react";
import { cleanup, render } from "@testing-library/react";
import { I18nProvider } from "../src/i18n";
import {
  VisitorStatsSkeleton,
  VisitorTableSkeleton,
} from "../src/features/visitor/components";
import {
  BoothRequestDetailsSkeleton,
  BoothRequestListSkeleton,
  EventRequestDetailsSkeleton,
  EventRequestListSkeleton,
  OrderStatsSkeleton,
} from "../src/features/order/components";
import {
  EventHallDetailsSkeleton,
  ManagementTableSkeleton,
  ServicesTableSkeleton,
} from "../src/features/management/components";
import { ProfileIdentitySkeleton } from "../src/features/profile/components";
import "./setup-dom";

afterEach(() => cleanup());

function renderSkeleton(component: ReactNode) {
  return render(<I18nProvider>{component}</I18nProvider>);
}

test("Visitor skeletons use stable card and table layouts", () => {
  const stats = renderSkeleton(<VisitorStatsSkeleton />);

  assert.equal(
    stats.container.querySelectorAll(".visitor-stats-skeleton__card").length,
    3,
  );
  assert.ok(stats.container.querySelectorAll(".skeleton").length >= 9);
  cleanup();

  const table = renderSkeleton(<VisitorTableSkeleton />);

  assert.equal(table.container.querySelectorAll(".data-table__row").length, 5);
  assert.ok(
    table.container.querySelectorAll(".visitor-table-skeleton .skeleton")
      .length >= 30,
  );
});

test("Order skeletons keep list, statistics, and modal layouts separate", () => {
  const stats = renderSkeleton(<OrderStatsSkeleton />);
  assert.equal(stats.container.querySelectorAll(".order-stats-skeleton__card").length, 3);
  cleanup();

  const boothList = renderSkeleton(<BoothRequestListSkeleton />);
  assert.equal(boothList.container.querySelectorAll(".data-table__row").length, 5);
  cleanup();

  const eventList = renderSkeleton(<EventRequestListSkeleton />);
  assert.equal(eventList.container.querySelectorAll(".data-table__row").length, 4);
  assert.ok(eventList.container.querySelector(".event-request-table"));
  cleanup();

  const boothDetails = renderSkeleton(<BoothRequestDetailsSkeleton />);
  assert.ok(boothDetails.container.querySelector(".booth-request-details-skeleton"));
  assert.equal(boothDetails.container.querySelectorAll(".card").length, 4);
  cleanup();

  const eventDetails = renderSkeleton(<EventRequestDetailsSkeleton />);
  assert.ok(eventDetails.container.querySelector(".event-request-details-skeleton"));
  assert.equal(eventDetails.container.querySelectorAll(".card").length, 4);
});

test("Management skeletons match each independent request area", () => {
  for (const variant of ["hall", "booth", "eventHall"] as const) {
    const table = renderSkeleton(<ManagementTableSkeleton variant={variant} />);
    assert.equal(table.container.querySelectorAll(".data-table__row").length, 5);
    cleanup();
  }

  const services = renderSkeleton(<ServicesTableSkeleton />);
  assert.equal(
    services.container.querySelectorAll(
      ".services-table-skeleton .management-services-modal__table-body .management-services-modal__row",
    ).length,
    3,
  );
  cleanup();

  const details = renderSkeleton(<EventHallDetailsSkeleton />);
  assert.ok(details.container.querySelector(".event-hall-details-skeleton"));
  assert.equal(
    details.container.querySelectorAll(
      ".management-event-hall-details__event-card",
    ).length,
    2,
  );
});

test("Profile loading replaces only the asynchronous identity card", () => {
  const view = renderSkeleton(<ProfileIdentitySkeleton />);

  assert.ok(view.container.querySelector(".profile-identity-skeleton"));
  assert.equal(
    view.container.querySelectorAll(".profile-identity-card__field").length,
    2,
  );
  assert.ok(view.getByRole("status"));
});
