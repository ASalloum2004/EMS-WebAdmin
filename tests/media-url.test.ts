import assert from "node:assert/strict";
import test from "node:test";
import {
  API_BASE_URL,
  addApiMediaRevision,
  removeApiMediaRevision,
  resolveApiMediaUrl,
} from "../src/api/index.js";

const apiOrigin = new URL(API_BASE_URL).origin;

test("resolves slash-relative and path-relative media against the API origin", () => {
  assert.equal(
    resolveApiMediaUrl("/storage/companies/logo.png"),
    `${apiOrigin}/storage/companies/logo.png`,
  );
  assert.equal(
    resolveApiMediaUrl("storage/managers/avatar.png"),
    `${apiOrigin}/storage/managers/avatar.png`,
  );
});

test("keeps absolute HTTP media valid and rejects unsafe schemes", () => {
  const httpsUrl = "https://cdn.example.com/images/logo.png?size=2";
  const httpUrl = "http://backend.example/storage/avatar.jpg";

  assert.equal(resolveApiMediaUrl(httpsUrl), httpsUrl);
  assert.equal(resolveApiMediaUrl(httpUrl), httpUrl);
  assert.equal(resolveApiMediaUrl("javascript:alert(1)"), null);
  assert.equal(resolveApiMediaUrl("file:///tmp/avatar.png"), null);
  assert.equal(resolveApiMediaUrl("blob:https://ems.test/local-preview"), null);
  assert.equal(resolveApiMediaUrl("data:image/png;base64,aGVsbG8="), null);
  assert.equal(resolveApiMediaUrl(""), null);
});

test("allows only explicitly trusted inline image data", () => {
  const inlineImage = "data:image/png;base64,aGVsbG8=";

  assert.equal(
    resolveApiMediaUrl(inlineImage, { allowInlineMedia: true }),
    inlineImage,
  );
  assert.equal(
    resolveApiMediaUrl("data:application/pdf;base64,aGVsbG8=", {
      allowInlineMedia: true,
    }),
    null,
  );
});

test("adds a stable revision only to media served from the API origin", () => {
  const sourceUrl = `${apiOrigin}/storage/avatars/admin.png?size=large`;
  const revisedUrl = addApiMediaRevision(sourceUrl, "upload-17");

  assert.ok(revisedUrl);
  const parsedUrl = new URL(revisedUrl);
  assert.equal(parsedUrl.searchParams.get("size"), "large");
  assert.equal(parsedUrl.searchParams.get("_ems_media_revision"), "upload-17");
  assert.equal(removeApiMediaRevision(revisedUrl), sourceUrl);
  assert.equal(
    addApiMediaRevision("https://cdn.example.com/avatar.png", "upload-17"),
    "https://cdn.example.com/avatar.png",
  );
});
