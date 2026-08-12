import "./setup-dom.js";
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { StrictMode, type ReactNode } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react";
import { AuthProvider, useAuth } from "../src/context/AuthContext.js";
import { ThemeProvider } from "../src/context/ThemeContext.js";
import { ProfileProvider } from "../src/features/profile/hooks/ProfileContext.js";
import { ProfilePage } from "../src/features/profile/pages/ProfilePage.js";
import { I18nProvider } from "../src/i18n/I18nContext.js";
import { AdminAppbar } from "../src/layouts/admin/AdminAppbar/AdminAppbar.js";
import { AdminLayout } from "../src/layouts/admin/AdminLayout/AdminLayout.js";

const originalFetch = globalThis.fetch;
const sessionStorageDescriptor = Object.getOwnPropertyDescriptor(
  globalThis,
  "sessionStorage",
);

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status,
  });
}

function profileResponse({
  avatar = null,
  name = "Cached Admin",
}: {
  avatar?: string | null;
  name?: string;
} = {}) {
  return {
    status: true,
    message: "Success",
    data: {
      avatar,
      email: "admin@example.com",
      id: 1,
      is_verified: true,
      name,
      type: "admin",
    },
  };
}

function setSession(token = "profile-cache-token") {
  window.sessionStorage.setItem(
    "auth_session",
    JSON.stringify({
      token,
      user: {
        email: "admin@example.com",
        id: "1",
        name: "Session Admin",
        role: "admin",
      },
    }),
  );
}

function setWrappedSession() {
  window.sessionStorage.setItem(
    "auth_session",
    JSON.stringify({
      data: {
        token: "wrapped-profile-cache-token",
        user: {
          email: "wrapped@example.com",
          id: 7,
          name: "Wrapped Admin",
          role: "admin",
        },
      },
    }),
  );
}

function RuntimeProviders({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <ThemeProvider>
        <AuthProvider>
          <ProfileProvider>{children}</ProfileProvider>
        </AuthProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}

function SignOutButton() {
  const { signOut } = useAuth();

  return (
    <button type="button" onClick={signOut}>
      Sign out test session
    </button>
  );
}

beforeEach(() => {
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: window.sessionStorage,
  });
  window.localStorage.setItem("ems-language", "en");
  setSession();
});

afterEach(() => {
  cleanup();
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

test("App Bar avatar is an accessible Profile navigation link", () => {
  const view = render(
    <I18nProvider>
      <AdminAppbar adminName="Test Admin" />
    </I18nProvider>,
  );
  const profileLink = view.getByRole("link", {
    name: "Open admin profile menu",
  }) as HTMLAnchorElement;
  let clickedProfileHref = "";

  profileLink.addEventListener("click", (event) => {
    event.preventDefault();
    clickedProfileHref = profileLink.getAttribute("href") ?? "";
  });
  fireEvent.click(profileLink);

  assert.equal(clickedProfileHref, "/profile");
});

test("a wrapped authenticated session does not crash protected profile consumers", async () => {
  setWrappedSession();
  let profileGetCount = 0;

  globalThis.fetch = async () => {
    profileGetCount += 1;
    return jsonResponse(profileResponse({ name: "Wrapped Admin" }));
  };

  const view = render(
    <RuntimeProviders>
      <AdminLayout>Protected content</AdminLayout>
    </RuntimeProviders>,
  );

  assert.ok(view.getByText("Protected content"));
  await view.findByText("Wrapped Admin");
  assert.equal(profileGetCount, 1);
});

test("one Profile GET is shared across page changes and a Profile page remount", async () => {
  let profileGetCount = 0;

  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    const method = (init?.method ?? "GET").toUpperCase();

    if (url.pathname.endsWith("/profile") && method === "GET") {
      profileGetCount += 1;
      return jsonResponse(profileResponse());
    }

    throw new Error(`Unexpected request: ${method} ${url.pathname}`);
  };

  const view = render(
    <RuntimeProviders>
      <AdminLayout>Companies content</AdminLayout>
    </RuntimeProviders>,
  );
  await view.findByText("Cached Admin");
  assert.equal(profileGetCount, 1);

  view.rerender(
    <RuntimeProviders>
      <AdminLayout>Reports content</AdminLayout>
    </RuntimeProviders>,
  );
  assert.ok(view.getByText("Reports content"));
  assert.equal(profileGetCount, 1);

  view.unmount();
  const profileView = render(
    <RuntimeProviders>
      <ProfilePage />
    </RuntimeProviders>,
  );
  assert.ok((await profileView.findAllByText("Cached Admin")).length >= 2);
  assert.equal(profileGetCount, 1);
  assert.equal(profileView.queryByText("Loading profile information"), null);
});

test("simultaneous Profile consumers share one in-flight request", async () => {
  let finishProfileRequest: ((response: Response) => void) | undefined;
  let profileGetCount = 0;

  globalThis.fetch = async () => {
    profileGetCount += 1;
    return new Promise<Response>((resolve) => {
      finishProfileRequest = resolve;
    });
  };

  const view = render(
    <StrictMode>
      <RuntimeProviders>
        <AdminLayout>Profile consumer</AdminLayout>
      </RuntimeProviders>
    </StrictMode>,
  );
  await waitFor(() => assert.equal(profileGetCount, 1));

  await act(async () => {
    finishProfileRequest?.(jsonResponse(profileResponse()));
  });
  await view.findByText("Cached Admin");
  assert.equal(profileGetCount, 1);
});

test("successful name updates immediately synchronize the shared App Bar profile", async () => {
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    const method = (init?.method ?? "GET").toUpperCase();

    if (url.pathname.endsWith("/profile") && method === "GET") {
      return jsonResponse(profileResponse({ name: "Old Admin" }));
    }

    if (url.pathname.endsWith("/profile") && method === "POST") {
      return jsonResponse(profileResponse({ name: "New Admin" }));
    }

    throw new Error(`Unexpected request: ${method} ${url.pathname}`);
  };

  const view = render(
    <RuntimeProviders>
      <ProfilePage />
    </RuntimeProviders>,
  );
  await view.findAllByText("Old Admin");
  assert.equal(
    view.container.querySelector(".admin-appbar__avatar-fallback")
      ?.textContent,
    "OA",
  );

  fireEvent.click(
    view.getByRole("button", { name: "Edit profile name" }),
  );
  fireEvent.change(view.getByRole("textbox", { name: "Profile name" }), {
    target: { value: "New Admin" },
  });
  fireEvent.click(view.getByRole("button", { name: "Save" }));

  await waitFor(() => {
    assert.equal(
      view.container.querySelector(".admin-appbar__avatar-fallback")
        ?.textContent,
      "NA",
    );
  });
  assert.ok(view.getAllByText("New Admin").length >= 2);
});

test("logout clears the cached Profile before a new session loads", async () => {
  let profileGetCount = 0;

  globalThis.fetch = async () => {
    profileGetCount += 1;
    return jsonResponse(
      profileResponse({
        name: profileGetCount === 1 ? "First Session" : "Second Session",
      }),
    );
  };

  const firstView = render(
    <RuntimeProviders>
      <AdminLayout>
        <SignOutButton />
      </AdminLayout>
    </RuntimeProviders>,
  );
  await firstView.findByText("First Session");
  fireEvent.click(
    firstView.getByRole("button", { name: "Sign out test session" }),
  );
  await waitFor(() => {
    assert.equal(window.sessionStorage.getItem("auth_session"), null);
  });
  firstView.unmount();

  setSession("new-profile-cache-token");
  const secondView = render(
    <RuntimeProviders>
      <AdminLayout>New session content</AdminLayout>
    </RuntimeProviders>,
  );
  await secondView.findByText("Second Session");
  assert.equal(secondView.queryByText("First Session"), null);
  assert.equal(profileGetCount, 2);
});

test("a failed initial Profile request remains retryable and is not cached", async () => {
  let profileGetCount = 0;

  globalThis.fetch = async () => {
    profileGetCount += 1;

    if (profileGetCount === 1) {
      return jsonResponse({ message: "Profile temporarily unavailable." }, 503);
    }

    return jsonResponse(profileResponse());
  };

  const view = render(
    <RuntimeProviders>
      <ProfilePage />
    </RuntimeProviders>,
  );
  await view.findByText("Profile temporarily unavailable.");
  fireEvent.click(view.getByRole("button", { name: "Try again" }));
  await view.findAllByText("Cached Admin");
  assert.equal(profileGetCount, 2);
});
