import "./setup-dom.js";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  cleanup,
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react";
import { AnnouncementList } from "../src/features/announcements/components/AnnouncementList/AnnouncementList.js";
import { getVisitorColumns } from "../src/features/visitor/components/VisitorTableColumns/VisitorTableColumns.js";
import type { VisitorApiData } from "../src/features/visitor/types.js";
import { I18nProvider } from "../src/i18n/I18nContext.js";
import { en } from "../src/i18n/locales/en.js";

const visitor: VisitorApiData = {
  avatar:
    "https://violations-salt-hybrid-springer.trycloudflare.com/storage/visitors/first.png",
  birthday: null,
  created_at: "2026-07-28T00:00:00.000000Z",
  email: "visitor@example.com",
  first_name: "Samira",
  gender: "female",
  id: 7,
  job: "Engineer",
  last_name: "Haddad",
  location: "Damascus",
  phone: null,
};

afterEach(() => cleanup());

test("visitor avatars fall back cleanly and retry only when the source changes", async () => {
  const identityColumn = getVisitorColumns(en)[0];
  assert.ok(identityColumn);
  const view = render(<>{identityColumn.render(visitor)}</>);
  const firstImage = view.container.querySelector("img");

  assert.ok(firstImage);
  assert.equal(firstImage.src, visitor.avatar);
  assert.equal(firstImage.getAttribute("loading"), "lazy");

  fireEvent.error(firstImage);
  assert.equal(view.container.querySelector("img"), null);
  assert.ok(view.getByText("SH"));

  const nextVisitor = {
    ...visitor,
    avatar:
      "https://violations-salt-hybrid-springer.trycloudflare.com/storage/visitors/second.png",
  };
  view.rerender(<>{identityColumn.render(nextVisitor)}</>);

  await waitFor(() => {
    const nextImage = view.container.querySelector("img");
    assert.ok(nextImage);
    assert.equal(nextImage.src, nextVisitor.avatar);
  });
});

test("extensionless signed announcement images render and fall back on failure", () => {
  const mediaUrl =
    "https://cdn.example.com/media/announcement?signature=abc123";
  const view = render(
    <I18nProvider>
      <AnnouncementList
        announcements={[
          {
            description: "An image without a filename extension.",
            id: 1,
            isDraft: false,
            media: mediaUrl,
            receiver: "all",
            title: "Signed media",
          },
        ]}
        emptyDescription=""
        emptyTitle=""
        error=""
        isLoading={false}
        isRefreshing={false}
        pagination={{
          currentPage: 1,
          perPage: 4,
          totalItems: 1,
          totalPages: 1,
        }}
        onPageChange={() => undefined}
        onRetry={() => undefined}
        onSelect={() => undefined}
      />
    </I18nProvider>,
  );
  const image = view.container.querySelector(
    ".announcement-list__media img",
  );

  assert.ok(image);
  assert.equal(image.getAttribute("src"), mediaUrl);
  assert.equal(image.getAttribute("loading"), "lazy");

  fireEvent.error(image);
  assert.equal(
    view.container.querySelector(".announcement-list__media img"),
    null,
  );
  assert.ok(view.getByLabelText("Media attachment"));
});
