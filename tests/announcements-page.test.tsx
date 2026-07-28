import "./setup-dom.js";
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { StrictMode } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  waitFor,
  within,
} from "@testing-library/react";
import { AnnouncementsPage } from "../src/features/announcements/pages/AnnouncementsPage.js";
import type { AnnouncementApiDto } from "../src/features/announcements/types.js";
import { I18nProvider } from "../src/i18n/I18nContext.js";

const originalFetch = globalThis.fetch;
const sessionStorageDescriptor = Object.getOwnPropertyDescriptor(
  globalThis,
  "sessionStorage",
);

interface RecordedRequest {
  body: Record<string, unknown> | null;
  method: string;
  url: URL;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status,
  });
}

function parseBody(body: BodyInit | null | undefined) {
  if (body instanceof FormData) {
    return Object.fromEntries(body.entries());
  }

  if (typeof body === "string") {
    const value: unknown = JSON.parse(body);
    return typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  }

  return null;
}

interface AnnouncementBackendOptions {
  firstAnnouncementMedia?: string | null;
  reuseReplacementMediaUrl?: boolean;
}

function createAnnouncementBackend(
  options: AnnouncementBackendOptions = {},
) {
  let announcements: AnnouncementApiDto[] = [
    {
      id: 1,
      title: "Draft Exhibitor Notice",
      description: "A draft announcement for exhibitors.",
      receiver: "Exhibitors",
      is_active: true,
      media: options.firstAnnouncementMedia ?? null,
    },
    {
      id: 2,
      title: "Published Exhibitor Notice",
      description: "A published announcement for exhibitors.",
      receiver: "Exhibitors",
      is_active: false,
      media: null,
    },
    {
      id: 3,
      title: "Visitor Registration Guide",
      description: "Registration guidance for visitors.",
      receiver: "visitors",
      is_active: false,
      media: null,
    },
    {
      id: 4,
      title: "All Users Draft",
      description: "A platform-wide draft.",
      receiver: "all",
      is_active: true,
      media: null,
    },
    {
      id: 5,
      title: "Second Page Announcement",
      description: "This record verifies backend pagination.",
      receiver: "all",
      is_active: false,
      media: null,
    },
  ];
  const requests: RecordedRequest[] = [];

  globalThis.fetch = async (input, init) => {
    const url = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url,
    );
    const method = (init?.method ?? "GET").toUpperCase();
    const body = parseBody(init?.body);
    requests.push({ body, method, url });

    if (url.pathname.endsWith("/profile")) {
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
    }

    if (url.pathname.endsWith("/announcements") && method === "GET") {
      const titleFilter = url.searchParams
        .get("filter[title]")
        ?.toLocaleLowerCase();
      const receiverFilter = url.searchParams.get("filter[receiver]");
      const draftFilter = url.searchParams.get("filter[is_active]");
      const page = Number(url.searchParams.get("page") ?? "1");
      const perPage = Number(url.searchParams.get("per_page") ?? "4");
      const filtered = announcements.filter((announcement) => {
        const matchesTitle = titleFilter
          ? announcement.title.toLocaleLowerCase().includes(titleFilter)
          : true;
        const matchesReceiver = receiverFilter
          ? announcement.receiver.toLocaleLowerCase() ===
            receiverFilter.toLocaleLowerCase()
          : true;
        const matchesDraft =
          draftFilter === null
            ? true
            : announcement.is_active === (draftFilter === "true");

        return matchesTitle && matchesReceiver && matchesDraft;
      });
      const pageStart = (page - 1) * perPage;

      return jsonResponse({
        status: true,
        message: "Announcements retrieved successfully.",
        data: {
          data: filtered.slice(pageStart, pageStart + perPage),
          current_page: page,
          per_page: perPage,
          total: filtered.length,
          last_page: Math.max(1, Math.ceil(filtered.length / perPage)),
        },
      });
    }

    if (url.pathname.endsWith("/announcements") && method === "POST") {
      const nextId = Math.max(0, ...announcements.map(({ id }) => id)) + 1;
      const created: AnnouncementApiDto = {
        id: nextId,
        title: String(body?.title ?? ""),
        description: String(body?.description ?? ""),
        receiver: String(body?.receiver ?? "all"),
        is_active: body?.is_active === "1",
        media:
          body?.media instanceof File
            ? `/storage/${body.media.name}`
            : null,
      };
      announcements = [created, ...announcements];

      return jsonResponse({
        status: true,
        message: "Announcement created successfully.",
        data: created,
      });
    }

    const announcementMatch = url.pathname.match(/\/announcements\/(\d+)$/);

    if (announcementMatch) {
      const announcementId = Number(announcementMatch[1]);
      const existingAnnouncement = announcements.find(
        ({ id }) => id === announcementId,
      );

      if (!existingAnnouncement) {
        return jsonResponse({ message: "Announcement not found." }, 404);
      }

      if (method === "GET") {
        return jsonResponse({
          status: true,
          message: "Announcement retrieved successfully.",
          data: existingAnnouncement,
        });
      }

      if (method === "POST") {
        const updatedAnnouncement: AnnouncementApiDto = {
          ...existingAnnouncement,
          title: String(body?.title ?? existingAnnouncement.title),
          description: String(
            body?.description ?? existingAnnouncement.description,
          ),
          receiver: String(body?.receiver ?? existingAnnouncement.receiver),
          is_active:
            body?.is_active === "1"
              ? true
              : body?.is_active === "0"
                ? false
                : existingAnnouncement.is_active,
          media:
            body && Object.hasOwn(body, "media")
              ? body.media instanceof File
                ? options.reuseReplacementMediaUrl &&
                  existingAnnouncement.media
                  ? existingAnnouncement.media
                  : `/storage/${body.media.name}`
                : body.media === ""
                  ? null
                  : existingAnnouncement.media
              : existingAnnouncement.media,
        };
        announcements = announcements.map((announcement) =>
          announcement.id === announcementId
            ? updatedAnnouncement
            : announcement,
        );

        return jsonResponse({
          status: true,
          message: "Announcement updated successfully.",
          data: updatedAnnouncement,
        });
      }

      if (method === "DELETE") {
        announcements = announcements.filter(
          ({ id }) => id !== announcementId,
        );

        return jsonResponse({
          status: true,
          message: "Announcement deleted successfully.",
          data: null,
        });
      }
    }

    throw new Error(`Unexpected request: ${method} ${url.pathname}`);
  };

  return { requests };
}

beforeEach(() => {
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: window.sessionStorage,
  });
  window.localStorage.setItem("ems-language", "en");
  window.sessionStorage.setItem(
    "auth_session",
    JSON.stringify({
      token: "announcement-page-token",
      user: {
        email: "admin@example.com",
        id: "1",
        name: "Test Admin",
        role: "admin",
      },
    }),
  );
});

afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
  globalThis.fetch = originalFetch;
  window.localStorage.clear();
  window.sessionStorage.clear();

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

test("loads, searches, and paginates announcements entirely through the backend", async () => {
  const backend = createAnnouncementBackend();
  const view = render(
    <I18nProvider>
      <AnnouncementsPage />
    </I18nProvider>,
  );

  assert.equal(
    view.getByRole("status").textContent,
    "Loading announcements",
  );
  assert.ok(view.container.querySelector(".announcement-list-skeleton"));
  await view.findByText("Draft Exhibitor Notice");
  assert.equal(
    view.container.querySelector(".announcement-list-skeleton"),
    null,
  );
  assert.ok(view.getAllByText("Draft").length >= 1);
  assert.ok(view.getAllByText("Published").length >= 1);
  assert.equal(view.queryByText("Active"), null);
  assert.equal(view.queryByText("Inactive"), null);

  fireEvent.click(view.getByRole("button", { name: "2" }));
  await view.findByText("Second Page Announcement");
  assert.equal(view.queryByText("Draft Exhibitor Notice"), null);

  const pageTwoRequest = backend.requests.find(
    ({ method, url }) =>
      method === "GET" &&
      url.pathname.endsWith("/announcements") &&
      url.searchParams.get("page") === "2",
  );
  assert.ok(pageTwoRequest);
  assert.equal(pageTwoRequest.url.searchParams.get("per_page"), "4");

  const searchInput = view.getByRole("searchbox", {
    name: "Search announcements by title",
  });
  fireEvent.change(searchInput, {
    target: { value: "Visitor Registration" },
  });
  await act(
    () =>
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, 450);
      }),
  );
  await view.findByText("Visitor Registration Guide");

  const searchRequest = backend.requests.find(
    ({ url }) =>
      url.searchParams.get("filter[title]") === "Visitor Registration",
  );
  assert.ok(searchRequest);
  assert.equal(searchRequest.url.searchParams.get("page"), "1");
});

test("Strict Mode starts one usable request and re-entry refetches once", async () => {
  const backend = createAnnouncementBackend();
  const view = render(
    <StrictMode>
      <I18nProvider>
        <AnnouncementsPage />
      </I18nProvider>
    </StrictMode>,
  );

  assert.equal(
    view.getByRole("status").textContent,
    "Loading announcements",
  );
  await view.findByText("Draft Exhibitor Notice");

  const listRequests = backend.requests.filter(
    ({ method, url }) =>
      method === "GET" && url.pathname.endsWith("/announcements"),
  );
  assert.equal(listRequests.length, 1);
  assert.equal(
    view.queryByText("Loading announcements"),
    null,
  );

  view.unmount();
  const returnedView = render(
    <StrictMode>
      <I18nProvider>
        <AnnouncementsPage />
      </I18nProvider>
    </StrictMode>,
  );

  assert.equal(
    returnedView.getByRole("status").textContent,
    "Loading announcements",
  );
  await returnedView.findByText("Draft Exhibitor Notice");

  const requestsAfterReentry = backend.requests.filter(
    ({ method, url }) =>
      method === "GET" && url.pathname.endsWith("/announcements"),
  );
  assert.equal(requestsAfterReentry.length, 2);
});

test("a failed list request exits the skeleton and Retry issues one fresh request", async () => {
  let listRequestCount = 0;

  globalThis.fetch = async (input, init) => {
    const url = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url,
    );
    const method = (init?.method ?? "GET").toUpperCase();

    if (url.pathname.endsWith("/profile")) {
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
    }

    if (url.pathname.endsWith("/announcements") && method === "GET") {
      listRequestCount += 1;

      if (listRequestCount === 1) {
        return jsonResponse(
          { message: "Unable to load announcements." },
          503,
        );
      }

      return jsonResponse({
        status: true,
        message: "Announcements retrieved successfully.",
        data: {
          data: [],
          current_page: 1,
          per_page: 4,
          total: 0,
          last_page: 1,
        },
      });
    }

    throw new Error(`Unexpected request: ${method} ${url.pathname}`);
  };

  const view = render(
    <I18nProvider>
      <AnnouncementsPage />
    </I18nProvider>,
  );

  assert.equal(
    view.getByRole("status").textContent,
    "Loading announcements",
  );
  await view.findByText("Unable to load announcements.");
  assert.equal(
    view.queryByText("Loading announcements"),
    null,
  );
  assert.equal(listRequestCount, 1);

  fireEvent.click(view.getByRole("button", { name: "Try again" }));
  await view.findByText("No announcements yet");
  assert.equal(listRequestCount, 2);
  assert.equal(
    view.queryByText("Loading announcements"),
    null,
  );
});

test("a stale search response cannot replace a newer result", async () => {
  let resolveSlowRequest: ((response: Response) => void) | null = null;
  const searchRequests: string[] = [];

  function listResponse(title: string) {
    return jsonResponse({
      status: true,
      message: "Announcements retrieved successfully.",
      data: {
        data: title
          ? [
              {
                id: title === "Newest Result" ? 2 : 1,
                title,
                description: `${title} description`,
                receiver: "all",
                is_active: false,
                media: null,
              },
            ]
          : [],
        current_page: 1,
        per_page: 4,
        total: title ? 1 : 0,
        last_page: 1,
      },
    });
  }

  globalThis.fetch = async (input, init) => {
    const url = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url,
    );
    const method = (init?.method ?? "GET").toUpperCase();

    if (url.pathname.endsWith("/profile")) {
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
    }

    if (url.pathname.endsWith("/announcements") && method === "GET") {
      const search = url.searchParams.get("filter[title]") ?? "";
      searchRequests.push(search);

      if (!search) {
        return listResponse("Initial Result");
      }

      if (search === "slow") {
        return new Promise<Response>((resolve) => {
          resolveSlowRequest = resolve;
        });
      }

      if (search === "newest") {
        return listResponse("Newest Result");
      }
    }

    throw new Error(`Unexpected request: ${method} ${url.pathname}`);
  };

  const view = render(
    <I18nProvider>
      <AnnouncementsPage />
    </I18nProvider>,
  );
  await view.findByText("Initial Result");
  const searchInput = view.getByRole("searchbox", {
    name: "Search announcements by title",
  });

  fireEvent.change(searchInput, { target: { value: "slow" } });
  await act(
    () =>
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, 450);
      }),
  );
  await waitFor(() => assert.ok(searchRequests.includes("slow")));

  fireEvent.change(searchInput, { target: { value: "newest" } });
  await act(
    () =>
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, 450);
      }),
  );
  await view.findByText("Newest Result");

  assert.ok(resolveSlowRequest);
  await act(() => {
    resolveSlowRequest?.(listResponse("Stale Result"));
  });
  await waitFor(() => {
    assert.ok(view.getByText("Newest Result"));
    assert.equal(view.queryByText("Stale Result"), null);
  });
});

test("sends receiver and Published filters using documented backend parameters", async () => {
  const backend = createAnnouncementBackend();
  const view = render(
    <I18nProvider>
      <AnnouncementsPage />
    </I18nProvider>,
  );

  await view.findByText("Draft Exhibitor Notice");
  fireEvent.click(
    view.getByRole("button", { name: "Open announcement filters" }),
  );
  const filters = view.getByRole("group", {
    name: "Announcement filters",
  });
  fireEvent.change(within(filters).getByLabelText("Target Audience"), {
    target: { value: "exhibitors" },
  });
  fireEvent.change(within(filters).getByLabelText("Publication State"), {
    target: { value: "published" },
  });
  fireEvent.click(within(filters).getByRole("button", { name: "Apply" }));

  await view.findByText("Published Exhibitor Notice");
  assert.equal(view.queryByText("Draft Exhibitor Notice"), null);
  await waitFor(() => {
    assert.ok(
      backend.requests.some(
        ({ url }) =>
          url.searchParams.get("filter[receiver]") === "Exhibitors" &&
          url.searchParams.get("filter[is_active]") === "false",
      ),
    );
  });
});

test("creates, fetches details, updates, and confirms deletion through the backend", async () => {
  const backend = createAnnouncementBackend();
  const view = render(
    <I18nProvider>
      <AnnouncementsPage />
    </I18nProvider>,
  );

  await view.findByText("Draft Exhibitor Notice");
  fireEvent.click(
    view.getByRole("button", {
      name: "Edit announcement Draft Exhibitor Notice",
    }),
  );
  const editDialog = view.getByRole("dialog", {
    name: "Edit Announcement",
  });
  assert.equal(
    within(editDialog).getByRole("status").textContent,
    "Loading announcement details",
  );
  assert.ok(
    editDialog.querySelector(".announcement-details-skeleton"),
  );
  const titleInput = (await within(editDialog).findByLabelText(
    "Title",
  )) as HTMLInputElement;
  const descriptionInput = within(editDialog).getByLabelText(
    "Description",
  ) as HTMLTextAreaElement;
  assert.equal(titleInput.value, "Draft Exhibitor Notice");

  fireEvent.change(titleInput, {
    target: { value: "Updated Backend Announcement" },
  });
  fireEvent.change(descriptionInput, {
    target: { value: "Updated through multipart POST." },
  });
  const saveButton = within(editDialog).getByRole("button", {
    name: "Save Changes",
  }) as HTMLButtonElement;
  assert.equal(saveButton.disabled, false);
  fireEvent.click(saveButton);

  await waitFor(() => {
    assert.ok(
      backend.requests.some(
        ({ method, url }) =>
          method === "POST" && /\/announcements\/\d+$/.test(url.pathname),
      ),
    );
  });

  await waitFor(() => {
    assert.equal(
      view.queryByRole("dialog", { name: "Edit Announcement" }),
      null,
    );
  });
  await view.findByText("Updated Backend Announcement");
  const updateRequest = backend.requests.find(
    ({ method, url }) =>
      method === "POST" && /\/announcements\/\d+$/.test(url.pathname),
  );
  assert.ok(updateRequest);
  assert.equal(updateRequest.body?.is_active, "1");
  assert.equal(Object.hasOwn(updateRequest.body ?? {}, "media"), false);

  const composeTitle = view.getByLabelText("Title") as HTMLInputElement;
  const composeDescription = view.getByLabelText(
    "Description",
  ) as HTMLTextAreaElement;
  fireEvent.change(composeTitle, {
    target: { value: "Published from Composer" },
  });
  fireEvent.change(composeDescription, {
    target: { value: "Created through POST." },
  });
  fireEvent.click(
    view.getByRole("checkbox", { name: /Save as Draft/ }),
  );
  fireEvent.click(
    view.getByRole("button", { name: "Create Announcement" }),
  );

  await waitFor(() => assert.equal(composeTitle.value, ""));
  const postRequest = backend.requests.find(
    ({ method, url }) =>
      method === "POST" && url.pathname.endsWith("/announcements"),
  );
  assert.ok(postRequest);
  assert.equal(postRequest.body?.is_active, "0");
  await view.findByText("Published from Composer");

  fireEvent.click(
    view.getByRole("button", {
      name: "Edit announcement Updated Backend Announcement",
    }),
  );
  const secondEditDialog = await view.findByRole("dialog", {
    name: "Edit Announcement",
  });
  await within(secondEditDialog).findByLabelText("Title");
  fireEvent.click(
    within(secondEditDialog).getByRole("button", { name: "Delete" }),
  );
  assert.equal(
    backend.requests.some(({ method }) => method === "DELETE"),
    false,
  );

  const deleteDialog = view.getByRole("alertdialog", {
    name: "Delete Announcement?",
  });
  assert.ok(
    within(deleteDialog).getByText(/Updated Backend Announcement/),
  );
  fireEvent.click(
    within(deleteDialog).getByRole("button", {
      name: "Delete Announcement",
    }),
  );
  await waitFor(() => {
    assert.ok(
      backend.requests.some(({ method }) => method === "DELETE"),
    );
  });

  await waitFor(() => {
    assert.equal(
      view.queryByRole("alertdialog", { name: "Delete Announcement?" }),
      null,
    );
  });
  await waitFor(() => {
    assert.equal(view.queryByText("Updated Backend Announcement"), null);
  });
});

test("created and replacement media are refetched from persisted backend URLs", async () => {
  const backend = createAnnouncementBackend();
  const view = render(
    <I18nProvider>
      <AnnouncementsPage />
    </I18nProvider>,
  );

  await view.findByText("Draft Exhibitor Notice");
  fireEvent.change(view.getByLabelText("Title"), {
    target: { value: "Uploaded media announcement" },
  });
  fireEvent.change(view.getByLabelText("Description"), {
    target: { value: "Uses a real multipart file." },
  });
  const composerFileInput = view.container.querySelector<HTMLInputElement>(
    ".announcement-composer .announcement-form__file-input",
  );
  assert.ok(composerFileInput);
  const createdFile = new File(["created-image"], "created.png", {
    type: "image/png",
  });
  fireEvent.change(composerFileInput, {
    target: { files: [createdFile] },
  });
  fireEvent.click(
    view.getByRole("button", { name: "Create Announcement" }),
  );

  const createdRow = await view.findByRole("button", {
    name: "Edit announcement Uploaded media announcement",
  });
  const createdImage = createdRow.querySelector("img");
  assert.ok(createdImage);
  assert.equal(
    createdImage.src,
    "https://violations-salt-hybrid-springer.trycloudflare.com/storage/created.png",
  );
  const createRequest = backend.requests.find(
    ({ body, method, url }) =>
      method === "POST" &&
      url.pathname.endsWith("/announcements") &&
      body?.title === "Uploaded media announcement",
  );
  assert.ok(createRequest?.body?.media instanceof File);
  assert.equal(createRequest.body.media.name, "created.png");

  fireEvent.click(createdRow);
  const editDialog = await view.findByRole("dialog", {
    name: "Edit Announcement",
  });
  await within(editDialog).findByLabelText("Title");
  const editFileInput = editDialog.querySelector<HTMLInputElement>(
    ".announcement-form__file-input",
  );
  assert.ok(editFileInput);
  const replacementFile = new File(
    ["replacement-image"],
    "replacement.webp",
    { type: "image/webp" },
  );
  fireEvent.change(editFileInput, {
    target: { files: [replacementFile] },
  });
  fireEvent.click(
    within(editDialog).getByRole("button", { name: "Save Changes" }),
  );

  await waitFor(() => {
    assert.equal(
      view.queryByRole("dialog", { name: "Edit Announcement" }),
      null,
    );
  });
  const refreshedRow = await view.findByRole("button", {
    name: "Edit announcement Uploaded media announcement",
  });
  const replacementImage = refreshedRow.querySelector("img");
  assert.ok(replacementImage);
  assert.equal(
    replacementImage.src,
    "https://violations-salt-hybrid-springer.trycloudflare.com/storage/replacement.webp",
  );
  const replacementRequest = backend.requests.find(
    ({ body, method, url }) =>
      method === "POST" &&
      /\/announcements\/\d+$/.test(url.pathname) &&
      body?.media instanceof File,
  );
  assert.ok(replacementRequest?.body?.media instanceof File);
  assert.equal(replacementRequest.body.media.name, "replacement.webp");
});

test("a reused replacement URL gets one stable cache revision in the list and reopened editor", async () => {
  const backend = createAnnouncementBackend({
    firstAnnouncementMedia: "/storage/reused.png",
    reuseReplacementMediaUrl: true,
  });
  const view = render(
    <I18nProvider>
      <AnnouncementsPage />
    </I18nProvider>,
  );

  await view.findByText("Draft Exhibitor Notice");
  fireEvent.click(
    view.getByRole("button", {
      name: "Edit announcement Draft Exhibitor Notice",
    }),
  );
  const editDialog = await view.findByRole("dialog", {
    name: "Edit Announcement",
  });
  await within(editDialog).findByLabelText("Title");
  const editFileInput = editDialog.querySelector<HTMLInputElement>(
    ".announcement-form__file-input",
  );
  assert.ok(editFileInput);
  fireEvent.change(editFileInput, {
    target: {
      files: [
        new File(["replacement"], "replacement.png", {
          type: "image/png",
        }),
      ],
    },
  });
  fireEvent.click(
    within(editDialog).getByRole("button", { name: "Save Changes" }),
  );

  await waitFor(() => {
    assert.equal(
      view.queryByRole("dialog", { name: "Edit Announcement" }),
      null,
    );
  });
  const refreshedRow = await view.findByRole("button", {
    name: "Edit announcement Draft Exhibitor Notice",
  });
  const refreshedImage = refreshedRow.querySelector("img");
  assert.ok(refreshedImage);
  const refreshedImageUrl = new URL(refreshedImage.src);
  assert.equal(refreshedImageUrl.pathname, "/storage/reused.png");
  assert.equal(
    refreshedImageUrl.searchParams.get("_ems_media_revision"),
    "1-1",
  );
  const listRequestsAfterUpdate = backend.requests.filter(
    ({ method, url }) =>
      method === "GET" && url.pathname.endsWith("/announcements"),
  );
  assert.equal(listRequestsAfterUpdate.length, 2);

  fireEvent.click(refreshedRow);
  const reopenedDialog = await view.findByRole("dialog", {
    name: "Edit Announcement",
  });
  const reopenedImage = (await within(reopenedDialog).findByAltText(
    "Announcement media preview",
  )) as HTMLImageElement;
  assert.equal(reopenedImage.src, refreshedImage.src);
});
