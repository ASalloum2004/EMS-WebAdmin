import "./setup-dom.js";
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  waitFor,
} from "@testing-library/react";
import { AnnouncementComposer } from "../src/features/announcements/components/AnnouncementComposer/AnnouncementComposer.js";
import { AnnouncementEditModal } from "../src/features/announcements/components/AnnouncementEditModal/AnnouncementEditModal.js";
import { useAnnouncementActions } from "../src/features/announcements/hooks/useAnnouncementActions.js";
import type {
  AnnouncementFormValues,
  AnnouncementUpdateValues,
} from "../src/features/announcements/types.js";
import { I18nProvider } from "../src/i18n/I18nContext.js";

const originalFetch = globalThis.fetch;
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

beforeEach(() => {
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: window.sessionStorage,
  });
  window.localStorage.setItem("ems-language", "en");
  window.sessionStorage.setItem(
    "auth_session",
    JSON.stringify({
      token: "announcement-upload-token",
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

test("composer validates MIME and byte size before creating an object URL", () => {
  let createObjectUrlCalls = 0;
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: () => {
      createObjectUrlCalls += 1;
      return `blob:preview-${createObjectUrlCalls}`;
    },
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: () => undefined,
  });
  const view = render(
    <I18nProvider>
      <AnnouncementComposer
        error=""
        fieldErrors={{}}
        isPending={false}
        onClearErrors={() => undefined}
        onCreate={async () => false}
      />
    </I18nProvider>,
  );
  const fileInput = view.container.querySelector<HTMLInputElement>(
    ".announcement-form__file-input",
  );
  assert.ok(fileInput);

  fireEvent.change(fileInput, {
    target: {
      files: [new File(["text"], "notes.txt", { type: "text/plain" })],
    },
  });
  assert.ok(view.getByText("Select a JPEG, PNG, GIF, WebP, or PDF file."));
  assert.equal(createObjectUrlCalls, 0);

  const oversizedFile = new File(["image"], "large.png", {
    type: "image/png",
  });
  Object.defineProperty(oversizedFile, "size", {
    configurable: true,
    value: 8192 * 1024 + 1,
  });
  const nextFileInput = view.container.querySelector<HTMLInputElement>(
    ".announcement-form__file-input",
  );
  assert.ok(nextFileInput);
  fireEvent.change(nextFileInput, { target: { files: [oversizedFile] } });
  assert.ok(view.getByText("The media file must not exceed 8 MB."));
  assert.equal(createObjectUrlCalls, 0);
});

test("composer previews valid images, revokes URLs, and preserves state after failure", async () => {
  const revokedUrls: string[] = [];
  let previewNumber = 0;
  let submittedValues: AnnouncementFormValues | null = null;
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: () => {
      previewNumber += 1;
      return `blob:preview-${previewNumber}`;
    },
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: (url: string) => revokedUrls.push(url),
  });
  const view = render(
    <I18nProvider>
      <AnnouncementComposer
        error="Upload request failed."
        fieldErrors={{ media: "The media field is invalid." }}
        isPending={false}
        onClearErrors={() => undefined}
        onCreate={async (values) => {
          submittedValues = values;
          return false;
        }}
      />
    </I18nProvider>,
  );
  assert.ok(view.getByText("The media field is invalid."));
  const titleInput = view.getByLabelText("Title") as HTMLInputElement;
  const descriptionInput = view.getByLabelText(
    "Description",
  ) as HTMLTextAreaElement;
  fireEvent.change(titleInput, { target: { value: "Upload notice" } });
  fireEvent.change(descriptionInput, {
    target: { value: "Keep this content after failure." },
  });
  const firstFile = new File(["one"], "first.png", {
    type: "image/png",
  });
  let fileInput = view.container.querySelector<HTMLInputElement>(
    ".announcement-form__file-input",
  );
  assert.ok(fileInput);
  fireEvent.change(fileInput, { target: { files: [firstFile] } });
  const firstPreview = view.getByAltText(
    "Announcement media preview",
  ) as HTMLImageElement;
  assert.equal(firstPreview.src, "blob:preview-1");

  const secondFile = new File(["two"], "second.webp", {
    type: "image/webp",
  });
  fileInput = view.container.querySelector<HTMLInputElement>(
    ".announcement-form__file-input",
  );
  assert.ok(fileInput);
  fireEvent.change(fileInput, { target: { files: [secondFile] } });
  assert.deepEqual(revokedUrls, ["blob:preview-1"]);

  fireEvent.click(view.getByRole("button", { name: "Create Announcement" }));
  await waitFor(() => assert.ok(submittedValues));
  const capturedValues = submittedValues as AnnouncementFormValues | null;
  assert.ok(capturedValues);
  assert.equal(capturedValues.mediaFile, secondFile);
  assert.equal(titleInput.value, "Upload notice");
  assert.equal(descriptionInput.value, "Keep this content after failure.");
  assert.ok(view.getByText("second.webp"));

  view.unmount();
  assert.deepEqual(revokedUrls, ["blob:preview-1", "blob:preview-2"]);
});

test("edit replacement keeps binary state, revokes superseded previews, and displays media errors", async () => {
  const revokedUrls: string[] = [];
  let previewNumber = 0;
  let submittedValues: AnnouncementUpdateValues | null = null;
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: () => {
      previewNumber += 1;
      return `blob:edit-preview-${previewNumber}`;
    },
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: (url: string) => revokedUrls.push(url),
  });
  const view = render(
    <I18nProvider>
      <AnnouncementEditModal
        announcement={{
          id: 17,
          title: "Saved announcement",
          description: "Saved description",
          receiver: "all",
          isDraft: false,
          media: "https://violations-salt-hybrid-springer.trycloudflare.com/storage/saved.png",
        }}
        detailsError=""
        detailsLoading={false}
        fieldErrors={{ media: "The media must be a valid file." }}
        isDeleteDialogOpen={false}
        isUpdatePending={false}
        mediaRevision={{
          mediaUrl:
            "https://violations-salt-hybrid-springer.trycloudflare.com/storage/saved.png",
          revision: "17-1",
        }}
        updateError="The given data was invalid."
        onClearErrors={() => undefined}
        onClose={() => undefined}
        onDelete={() => undefined}
        onRetry={() => undefined}
        onSave={async (values) => {
          submittedValues = values;
          return false;
        }}
      />
    </I18nProvider>,
  );
  const savedImage = view.getByAltText(
    "Announcement media preview",
  ) as HTMLImageElement;
  assert.equal(
    new URL(savedImage.src).searchParams.get("_ems_media_revision"),
    "17-1",
  );
  assert.ok(view.getByText("The media must be a valid file."));

  const firstReplacement = new File(["first"], "first.png", {
    type: "image/png",
  });
  let fileInput = view.container.querySelector<HTMLInputElement>(
    ".announcement-form__file-input",
  );
  assert.ok(fileInput);
  fireEvent.change(fileInput, { target: { files: [firstReplacement] } });
  assert.equal(
    (view.getByAltText("Announcement media preview") as HTMLImageElement)
      .src,
    "blob:edit-preview-1",
  );

  fileInput = view.container.querySelector<HTMLInputElement>(
    ".announcement-form__file-input",
  );
  assert.ok(fileInput);
  fireEvent.change(fileInput, {
    target: {
      files: [new File(["invalid"], "invalid.txt", { type: "text/plain" })],
    },
  });
  assert.deepEqual(revokedUrls, ["blob:edit-preview-1"]);
  assert.ok(view.getByText("Select a JPEG, PNG, GIF, WebP, or PDF file."));

  const retryFile = new File(["retry"], "retry.webp", {
    type: "image/webp",
  });
  fileInput = view.container.querySelector<HTMLInputElement>(
    ".announcement-form__file-input",
  );
  assert.ok(fileInput);
  fireEvent.change(fileInput, { target: { files: [retryFile] } });
  fireEvent.click(view.getByRole("button", { name: "Save Changes" }));
  await waitFor(() => assert.ok(submittedValues));
  const capturedValues = submittedValues as AnnouncementUpdateValues | null;
  assert.ok(capturedValues);
  assert.equal(capturedValues.mediaFile, retryFile);
  assert.equal(capturedValues.mediaUpdate, "replace");
  assert.equal(
    (view.getByAltText("Announcement media preview") as HTMLImageElement)
      .src,
    "blob:edit-preview-2",
  );
  assert.ok(view.getByText("The given data was invalid."));

  view.unmount();
  assert.deepEqual(revokedUrls, [
    "blob:edit-preview-1",
    "blob:edit-preview-2",
  ]);
});

test("announcement action hook rejects duplicate creates and maps 422 media errors", async () => {
  let requestCount = 0;
  let finishRequest: ((response: Response) => void) | undefined;
  globalThis.fetch = async () => {
    requestCount += 1;
    return new Promise<Response>((resolve) => {
      finishRequest = resolve;
    });
  };
  const hook = renderHook(() =>
    useAnnouncementActions({
      createErrorFallback: "Create failed.",
      createSuccessFallback: "Created.",
      deleteErrorFallback: "Delete failed.",
      deleteSuccessFallback: "Deleted.",
      updateErrorFallback: "Update failed.",
      updateSuccessFallback: "Updated.",
    }),
  );
  const values: AnnouncementFormValues = {
    title: "Announcement",
    description: "Description",
    receiver: "all",
    isDraft: true,
    mediaFile: null,
  };
  let firstRequest: Promise<boolean> | undefined;
  await act(async () => {
    firstRequest = hook.result.current.runCreate(values);
    await Promise.resolve();
  });
  let duplicateResult = true;
  await act(async () => {
    duplicateResult = await hook.result.current.runCreate(values);
  });
  assert.equal(duplicateResult, false);
  assert.equal(requestCount, 1);

  await act(async () => {
    finishRequest?.(
      new Response(
        JSON.stringify({
          message: "The given data was invalid.",
          errors: { media: ["The media must be a valid file."] },
        }),
        { headers: { "Content-Type": "application/json" }, status: 422 },
      ),
    );
    await firstRequest;
  });
  assert.equal(
    hook.result.current.createFieldErrors.media,
    "The media must be a valid file.",
  );
  assert.equal(hook.result.current.createError, "The given data was invalid.");
});

test("announcement action hook rejects duplicate updates and exposes 422 media errors", async () => {
  let requestCount = 0;
  let finishRequest: ((response: Response) => void) | undefined;
  globalThis.fetch = async () => {
    requestCount += 1;
    return new Promise<Response>((resolve) => {
      finishRequest = resolve;
    });
  };
  const hook = renderHook(() =>
    useAnnouncementActions({
      createErrorFallback: "Create failed.",
      createSuccessFallback: "Created.",
      deleteErrorFallback: "Delete failed.",
      deleteSuccessFallback: "Deleted.",
      updateErrorFallback: "Update failed.",
      updateSuccessFallback: "Updated.",
    }),
  );
  const values: AnnouncementUpdateValues = {
    title: "Announcement",
    description: "Description",
    receiver: "all",
    isDraft: false,
    mediaFile: new File(["replacement"], "replacement.png", {
      type: "image/png",
    }),
    mediaUpdate: "replace",
  };
  let firstRequest: Promise<boolean> | undefined;
  await act(async () => {
    firstRequest = hook.result.current.runUpdate(17, values);
    await Promise.resolve();
  });
  let duplicateResult = true;
  await act(async () => {
    duplicateResult = await hook.result.current.runUpdate(17, values);
  });
  assert.equal(duplicateResult, false);
  assert.equal(requestCount, 1);

  await act(async () => {
    finishRequest?.(
      new Response(
        JSON.stringify({
          message: "The given data was invalid.",
          errors: { media: ["The media must be a valid file."] },
        }),
        { headers: { "Content-Type": "application/json" }, status: 422 },
      ),
    );
    await firstRequest;
  });
  assert.equal(
    hook.result.current.updateFieldErrors.media,
    "The media must be a valid file.",
  );
  assert.equal(hook.result.current.updateError, "The given data was invalid.");
  assert.equal(hook.result.current.updatePending, false);
});
