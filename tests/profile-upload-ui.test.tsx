import "./setup-dom.js";
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import {
  act,
  cleanup,
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react";
import { AuthProvider } from "../src/context/AuthContext.js";
import { ThemeProvider } from "../src/context/ThemeContext.js";
import { ProfilePage } from "../src/features/profile/pages/ProfilePage.js";
import { I18nProvider } from "../src/i18n/I18nContext.js";

const originalFetch = globalThis.fetch;
const imageDescriptor = Object.getOwnPropertyDescriptor(globalThis, "Image");
const createObjectUrlDescriptor = Object.getOwnPropertyDescriptor(
  URL,
  "createObjectURL",
);
const revokeObjectUrlDescriptor = Object.getOwnPropertyDescriptor(
  URL,
  "revokeObjectURL",
);
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

function profileResponse(avatar: string | null) {
  return {
    status: true,
    message: "Success",
    data: {
      avatar,
      email: "admin@example.com",
      id: 1,
      is_verified: true,
      name: "Test Admin",
      type: "admin",
    },
  };
}

function renderProfilePage() {
  return render(
    <I18nProvider>
      <ThemeProvider>
        <AuthProvider>
          <ProfilePage />
        </AuthProvider>
      </ThemeProvider>
    </I18nProvider>,
  );
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
      token: "profile-upload-token",
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
  globalThis.fetch = originalFetch;
  window.localStorage.clear();
  window.sessionStorage.clear();

  if (imageDescriptor) {
    Object.defineProperty(globalThis, "Image", imageDescriptor);
  } else {
    Reflect.deleteProperty(globalThis, "Image");
  }
  if (createObjectUrlDescriptor) {
    Object.defineProperty(URL, "createObjectURL", createObjectUrlDescriptor);
  }
  if (revokeObjectUrlDescriptor) {
    Object.defineProperty(URL, "revokeObjectURL", revokeObjectUrlDescriptor);
  }
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

test("successful avatar upload updates shared UI and survives a remount", async () => {
  let persistedAvatar = "/storage/avatars/old.png";
  let recordedUpload: FormData | null = null;
  let finishUpload: ((response: Response) => void) | undefined;
  const revokedUrls: string[] = [];
  let postCount = 0;

  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: () => "blob:avatar-preview",
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: (url: string) => revokedUrls.push(url),
  });
  class LoadableImage {
    onerror: (() => void) | null = null;
    onload: (() => void) | null = null;

    set src(_value: string) {
      queueMicrotask(() => this.onload?.());
    }
  }
  Object.defineProperty(globalThis, "Image", {
    configurable: true,
    value: LoadableImage,
  });

  globalThis.fetch = async (input, init) => {
    const url = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url,
    );
    const method = (init?.method ?? "GET").toUpperCase();

    if (url.pathname.endsWith("/profile") && method === "GET") {
      return jsonResponse(profileResponse(persistedAvatar));
    }

    if (url.pathname.endsWith("/profile") && method === "POST") {
      postCount += 1;
      assert.ok(init?.body instanceof FormData);
      recordedUpload = init.body;
      return new Promise<Response>((resolve) => {
        finishUpload = resolve;
      });
    }

    throw new Error(`Unexpected request: ${method} ${url.pathname}`);
  };

  const view = renderProfilePage();
  let fileInput: HTMLInputElement | null = null;
  await waitFor(() => {
    fileInput = view.container.querySelector<HTMLInputElement>(
      ".profile-identity-card__avatar-input",
    );
    assert.ok(fileInput);
  });
  assert.ok(fileInput);
  const avatarFile = new File(["new-avatar"], "new-avatar.png", {
    type: "image/png",
  });
  fireEvent.change(fileInput, { target: { files: [avatarFile] } });
  const localPreview = view.container.querySelector<HTMLImageElement>(
    ".profile-identity-card__avatar img",
  );
  assert.ok(localPreview);
  assert.equal(localPreview.src, "blob:avatar-preview");
  assert.equal(postCount, 1);

  persistedAvatar = "/storage/avatars/new-avatar.png";
  await act(async () => {
    finishUpload?.(jsonResponse(profileResponse(persistedAvatar)));
  });
  const persistedUrl =
    "https://violations-salt-hybrid-springer.trycloudflare.com/storage/avatars/new-avatar.png";
  await waitFor(() => {
    const persistedImages = view.container.querySelectorAll(
      `img[src="${persistedUrl}"]`,
    );
    assert.equal(persistedImages.length, 2);
  });
  assert.deepEqual(revokedUrls, ["blob:avatar-preview"]);
  const capturedUpload = recordedUpload as FormData | null;
  assert.ok(capturedUpload);
  const uploadedAvatar = capturedUpload.get("avatar");
  assert.ok(uploadedAvatar instanceof File);
  assert.equal(uploadedAvatar.name, avatarFile.name);

  view.unmount();
  const refreshedView = renderProfilePage();
  await waitFor(() => {
    assert.equal(
      refreshedView.container.querySelectorAll(`img[src="${persistedUrl}"]`)
        .length,
      2,
    );
  });
});

test("invalid files and backend 422 errors keep the previous profile avatar", async () => {
  const oldAvatar =
    "https://violations-salt-hybrid-springer.trycloudflare.com/storage/avatars/old.png";
  let postCount = 0;
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: () => "blob:failed-avatar-preview",
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: () => undefined,
  });
  globalThis.fetch = async (input, init) => {
    const url = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url,
    );
    const method = (init?.method ?? "GET").toUpperCase();

    if (url.pathname.endsWith("/profile") && method === "GET") {
      return jsonResponse(profileResponse("/storage/avatars/old.png"));
    }

    if (url.pathname.endsWith("/profile") && method === "POST") {
      postCount += 1;
      return jsonResponse(
        {
          message: "The given data was invalid.",
          errors: { avatar: ["The avatar must be a valid image."] },
        },
        422,
      );
    }

    throw new Error(`Unexpected request: ${method} ${url.pathname}`);
  };

  const view = renderProfilePage();
  let persistedImage: HTMLImageElement | null = null;
  await waitFor(() => {
    persistedImage = view.container.querySelector<HTMLImageElement>(
      `.profile-identity-card__avatar img[src="${oldAvatar}"]`,
    );
    assert.ok(persistedImage);
  });
  fireEvent.error(persistedImage!);
  assert.ok(view.getByText("The saved profile photo could not be displayed."));
  let fileInput = view.container.querySelector<HTMLInputElement>(
    ".profile-identity-card__avatar-input",
  );
  assert.ok(fileInput);
  fireEvent.change(fileInput, {
    target: {
      files: [new File(["text"], "avatar.txt", { type: "text/plain" })],
    },
  });
  assert.ok(view.getByText("Select a JPEG, PNG, or WebP image."));
  assert.equal(postCount, 0);

  const oversizedAvatar = new File(["image"], "large.png", {
    type: "image/png",
  });
  Object.defineProperty(oversizedAvatar, "size", {
    configurable: true,
    value: 4096 * 1024 + 1,
  });
  fileInput = view.container.querySelector<HTMLInputElement>(
    ".profile-identity-card__avatar-input",
  );
  assert.ok(fileInput);
  fireEvent.change(fileInput, { target: { files: [oversizedAvatar] } });
  assert.ok(view.getByText("The profile photo must not exceed 4 MB."));
  assert.equal(postCount, 0);

  fileInput = view.container.querySelector<HTMLInputElement>(
    ".profile-identity-card__avatar-input",
  );
  assert.ok(fileInput);
  fireEvent.change(fileInput, {
    target: {
      files: [new File(["image"], "avatar.png", { type: "image/png" })],
    },
  });
  await view.findByText("The avatar must be a valid image.");
  assert.equal(postCount, 1);
  assert.ok(
    view.container.querySelector(
      `.profile-identity-card__avatar img[src="${oldAvatar}"]`,
    ),
  );
});
