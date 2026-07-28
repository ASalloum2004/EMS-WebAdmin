import "./setup-dom.js";
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { mapProfileResponse } from "../src/features/profile/api/profileShowApi.js";
import { updateProfile } from "../src/features/profile/api/profileUpdateApi.js";
import {
  getProfileAvatarValidationError,
  PROFILE_AVATAR_MAX_BYTES,
} from "../src/features/profile/data/profileAvatar.js";

const originalFetch = globalThis.fetch;
const sessionStorageDescriptor = Object.getOwnPropertyDescriptor(
  globalThis,
  "sessionStorage",
);

beforeEach(() => {
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: window.sessionStorage,
  });
  window.sessionStorage.setItem(
    "auth_session",
    JSON.stringify({
      token: "profile-test-token",
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
  globalThis.fetch = originalFetch;
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

test("profile update posts authenticated multipart data with the avatar bytes", async () => {
  let recordedUrl = "";
  let recordedInit: RequestInit | undefined;
  const avatarFile = new File(["avatar-bytes"], "avatar.png", {
    type: "image/png",
  });

  globalThis.fetch = async (input, init) => {
    recordedUrl =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    recordedInit = init;

    return new Response(
      JSON.stringify({
        status: true,
        message: "Profile updated.",
        data: {
          avatar: "storage/avatars/avatar.png",
          email: "admin@example.com",
          id: 1,
          is_verified: true,
          name: "Test Admin",
          type: "admin",
        },
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  };

  const profile = await updateProfile({
    avatar: avatarFile,
    name: "Test Admin",
  });

  assert.equal(recordedUrl.endsWith("/api/v1/admin/profile"), true);
  assert.equal(recordedInit?.method, "POST");
  const headers = new Headers(recordedInit?.headers);
  assert.equal(headers.get("Accept"), "application/json");
  assert.equal(headers.get("Authorization"), "Bearer profile-test-token");
  assert.equal(headers.has("Content-Type"), false);
  assert.ok(recordedInit?.body instanceof FormData);
  assert.equal(recordedInit.body.get("name"), "Test Admin");
  const uploadedAvatar = recordedInit.body.get("avatar");
  assert.ok(uploadedAvatar instanceof File);
  assert.equal(uploadedAvatar.name, avatarFile.name);
  assert.equal(uploadedAvatar.type, avatarFile.type);
  assert.deepEqual(
    new Uint8Array(await uploadedAvatar.arrayBuffer()),
    new Uint8Array(await avatarFile.arrayBuffer()),
  );
  assert.equal(
    profile.avatar,
    "https://violations-salt-hybrid-springer.trycloudflare.com/storage/avatars/avatar.png",
  );
});

test("profile media normalization handles slash-relative and rejects unsafe URLs", () => {
  const baseProfile = {
    email: "admin@example.com",
    id: 1,
    is_verified: true,
    name: "Test Admin",
    type: "admin",
  };

  assert.equal(
    mapProfileResponse({ ...baseProfile, avatar: "/storage/avatar.png" })
      .avatar,
    "https://violations-salt-hybrid-springer.trycloudflare.com/storage/avatar.png",
  );
  assert.equal(
    mapProfileResponse({ ...baseProfile, avatar: "javascript:alert(1)" })
      .avatar,
    "",
  );
});

test("profile avatar validation uses bytes, rejects empty and unsupported files", () => {
  const validBoundaryFile = new File(
    [new Uint8Array(PROFILE_AVATAR_MAX_BYTES)],
    "avatar.webp",
    { type: "image/webp" },
  );
  const oversizedFile = new File(
    [new Uint8Array(PROFILE_AVATAR_MAX_BYTES + 1)],
    "avatar.png",
    { type: "image/png" },
  );

  assert.equal(getProfileAvatarValidationError(validBoundaryFile), null);
  assert.equal(
    getProfileAvatarValidationError(oversizedFile),
    "avatarTooLarge",
  );
  assert.equal(
    getProfileAvatarValidationError(
      new File([], "empty.png", { type: "image/png" }),
    ),
    "avatarEmpty",
  );
  assert.equal(
    getProfileAvatarValidationError(
      new File(["svg"], "avatar.svg", { type: "image/svg+xml" }),
    ),
    "avatarUnsupported",
  );
});
