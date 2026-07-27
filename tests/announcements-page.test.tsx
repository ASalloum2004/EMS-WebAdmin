import "./setup-dom.js";
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { cleanup, fireEvent, render, within } from "@testing-library/react";
import { AnnouncementsPage } from "../src/features/announcements/pages/AnnouncementsPage.js";
import { I18nProvider } from "../src/i18n/I18nContext.js";

const originalFetch = globalThis.fetch;

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}

function installProfileFetch() {
  const requestedPaths: string[] = [];

  globalThis.fetch = async (input) => {
    const requestedUrl = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url,
    );
    requestedPaths.push(requestedUrl.pathname);

    if (!requestedUrl.pathname.endsWith("/profile")) {
      throw new Error(`Unexpected request: ${requestedUrl.pathname}`);
    }

    return jsonResponse({
      status: true,
      message: "Success",
      data: {
        avatar: null,
        email: "admin@example.com",
        id: 1,
        is_verified: true,
        name: "Test Admin",
        type: "admin",
      },
    });
  };

  return requestedPaths;
}

beforeEach(() => {
  window.localStorage.setItem("ems-language", "en");
});

afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
  globalThis.fetch = originalFetch;
  window.localStorage.clear();
});

test("AnnouncementsPage edits and deletes local announcements without displaying unsupported fields", async () => {
  const requestedPaths = installProfileFetch();
  const view = render(
    <I18nProvider>
      <AnnouncementsPage />
    </I18nProvider>,
  );

  assert.ok(view.getByRole("heading", { name: "Announcements", level: 1 }));
  assert.equal(view.queryByText("#101"), null);
  assert.equal(view.queryByText(/Yesterday|days ago|ago$/), null);

  fireEvent.click(
    view.getByRole("button", {
      name: "Edit announcement Welcome, Exhibitors",
    }),
  );
  const editDialog = view.getByRole("dialog", {
    name: "Edit Announcement",
  });
  const titleInput = within(editDialog).getByLabelText(
    "Title",
  ) as HTMLInputElement;
  const descriptionInput = within(editDialog).getByLabelText(
    "Description",
  ) as HTMLTextAreaElement;

  assert.equal(titleInput.value, "Welcome, Exhibitors");
  assert.ok(descriptionInput.value.includes("exhibitor workspace"));
  assert.equal(within(editDialog).queryByText("101"), null);

  fireEvent.change(titleInput, {
    target: { value: "Updated Exhibitor Welcome" },
  });
  fireEvent.change(descriptionInput, {
    target: { value: "Updated local announcement description." },
  });
  fireEvent.click(
    within(editDialog).getByRole("button", { name: "Save Changes" }),
  );

  assert.equal(view.queryByRole("dialog", { name: "Edit Announcement" }), null);
  assert.ok(view.getByText("Updated Exhibitor Welcome"));
  assert.ok(view.getByText("Updated local announcement description."));

  fireEvent.click(
    view.getByRole("button", {
      name: "Edit announcement Updated Exhibitor Welcome",
    }),
  );
  fireEvent.click(
    within(view.getByRole("dialog", { name: "Edit Announcement" })).getByRole(
      "button",
      { name: "Delete" },
    ),
  );

  const deleteDialog = view.getByRole("alertdialog", {
    name: "Delete Announcement?",
  });
  assert.ok(within(deleteDialog).getByText(/Updated Exhibitor Welcome/));
  assert.ok(view.getByText("Updated Exhibitor Welcome"));
  fireEvent.click(
    within(deleteDialog).getByRole("button", {
      name: "Delete Announcement",
    }),
  );

  assert.equal(view.queryByText("Updated Exhibitor Welcome"), null);
  assert.ok(requestedPaths.every((path) => path.endsWith("/profile")));
});

test("AnnouncementsPage creates, searches, and paginates entirely in local state", async () => {
  installProfileFetch();
  const view = render(
    <I18nProvider>
      <AnnouncementsPage />
    </I18nProvider>,
  );
  const titleInput = view.getByLabelText("Title");
  const descriptionInput = view.getByLabelText("Description");

  fireEvent.change(titleInput, { target: { value: "Visitor Welcome Desk" } });
  fireEvent.change(descriptionInput, {
    target: { value: "The welcome desk is ready to help all visitors." },
  });
  fireEvent.click(view.getByLabelText("Visitors"));
  fireEvent.click(view.getByRole("button", { name: "Create Announcement" }));

  assert.ok(view.getByText("Visitor Welcome Desk"));
  assert.ok(view.getByText("The welcome desk is ready to help all visitors."));

  const searchInput = view.getByRole("searchbox", {
    name: "Search announcements by title",
  });
  fireEvent.change(searchInput, { target: { value: "Registration Guide" } });
  assert.ok(view.getByText("Visitor Registration Guide"));
  assert.equal(view.queryByText("Visitor Welcome Desk"), null);

  fireEvent.change(searchInput, { target: { value: "not a matching title" } });
  assert.ok(view.getByText("No announcements found"));

  fireEvent.change(searchInput, { target: { value: "" } });
  fireEvent.click(view.getByRole("button", { name: "2" }));
  assert.ok(view.getByText("Event Program Update"));
  assert.equal(view.queryByText("Visitor Welcome Desk"), null);
});
