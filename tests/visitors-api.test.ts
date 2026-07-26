import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_VISITORS_PER_PAGE,
  buildVisitorsPath,
  getVisitors,
  normalizeVisitorsResponse,
} from "../src/features/visitor/api/visitorsApi.js";
import {
  getVisitorStatistics,
  normalizeVisitorStatisticsResponse,
} from "../src/features/visitor/api/visitorStatisticsApi.js";
import {
  applyVisitorFilters,
  clearVisitorFilters,
  createEmptyVisitorFilters,
  getVisitorFilterParams,
} from "../src/features/visitor/hooks/useVisitorFilters.js";
import type {
  VisitorApiResponse,
  VisitorFilters,
  VisitorStatisticsResponse,
} from "../src/features/visitor/types.js";

const visitorsResponse: VisitorApiResponse = {
  status: true,
  message: "Success",
  data: {
    data: [
      {
        id: 1,
        first_name: "Mohamad",
        last_name: "Ze Alnoun",
        email: "visitor@example.com",
        phone: "+963000000000",
        job: "Software Engineer",
        location: "Syria,Damascus",
        birthday: "2006-02-06T00:00:00.000000Z",
        gender: "male",
        created_at: "2026-07-21T22:00:53.000000Z",
        avatar: null,
      },
    ],
    current_page: 1,
    per_page: 15,
    total: 1,
    last_page: 1,
  },
};

const statisticsResponse: VisitorStatisticsResponse = {
  status: true,
  message: "Success",
  data: {
    total_visitors: 1,
    male_visitors: 1,
    female_visitors: 0,
  },
};

function getPathSearchParams(path: string) {
  return new URL(path, "https://ems.test").searchParams;
}

function installAuthenticatedSession() {
  const sessionStorageDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "sessionStorage",
  );

  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
      getItem: (key: string) =>
        key === "auth_session"
          ? JSON.stringify({ token: "visitor-test-token" })
          : null,
    } as Storage,
  });

  return () => {
    if (sessionStorageDescriptor) {
      Object.defineProperty(
        globalThis,
        "sessionStorage",
        sessionStorageDescriptor,
      );
    } else {
      Reflect.deleteProperty(globalThis, "sessionStorage");
    }
  };
}

test("normalizes the verified visitor response and pagination", () => {
  const result = normalizeVisitorsResponse(visitorsResponse);

  assert.deepEqual(result.visitors, visitorsResponse.data.data);
  assert.deepEqual(result.pagination, {
    currentPage: 1,
    perPage: 15,
    totalItems: 1,
    totalPages: 1,
  });
});

test("builds the visitor path with the verified defaults", () => {
  const searchParams = getPathSearchParams(buildVisitorsPath());

  assert.equal(DEFAULT_VISITORS_PER_PAGE, 15);
  assert.equal(searchParams.get("page"), "1");
  assert.equal(searchParams.get("per_page"), "15");
});

test("combines exact bracketed visitor filters and pagination", () => {
  const path = buildVisitorsPath({
    search: "  Mohamad  ",
    gender: "male",
    job: "  Software Engineer ",
    location: " Damascus ",
    page: 2,
    perPage: 15,
  });
  const searchParams = getPathSearchParams(path);

  assert.match(path, /filter%5Bsearch%5D=Mohamad/);
  assert.equal(searchParams.get("filter[search]"), "Mohamad");
  assert.equal(searchParams.get("filter[gender]"), "male");
  assert.equal(searchParams.get("filter[job]"), "Software Engineer");
  assert.equal(searchParams.get("filter[location]"), "Damascus");
  assert.equal(searchParams.get("page"), "2");
  assert.equal(searchParams.get("per_page"), "15");
});

test("omits empty visitor filters", () => {
  const searchParams = getPathSearchParams(
    buildVisitorsPath({ job: "  ", location: "", search: " " }),
  );

  assert.equal(searchParams.has("filter[search]"), false);
  assert.equal(searchParams.has("filter[gender]"), false);
  assert.equal(searchParams.has("filter[job]"), false);
  assert.equal(searchParams.has("filter[location]"), false);
});

test("sends names, email addresses, and phone numbers through filter[search]", () => {
  const searchValues = [
    "Mohamad Ze Alnoun",
    "visitor@example.com",
    "+963000000000",
  ];

  for (const searchValue of searchValues) {
    const searchParams = getPathSearchParams(
      buildVisitorsPath({ search: searchValue }),
    );

    assert.equal(searchParams.get("filter[search]"), searchValue);
    assert.equal(searchParams.has("filter[name]"), false);
    assert.equal(searchParams.has("filter[email]"), false);
    assert.equal(searchParams.has("filter[phone]"), false);
  }
});

test("apply and clear normalize filters and reset pagination", () => {
  const draftFilters: VisitorFilters = {
    gender: "female",
    job: "  Designer  ",
    location: "  Damascus  ",
  };
  let currentPage = 4;
  const resetPage = () => {
    currentPage = 1;
  };

  const applied = applyVisitorFilters(draftFilters, resetPage);
  assert.equal(currentPage, 1);
  assert.deepEqual(getVisitorFilterParams(applied), {
    gender: "female",
    job: "Designer",
    location: "Damascus",
  });

  currentPage = 3;
  const cleared = clearVisitorFilters(resetPage);
  assert.equal(currentPage, 1);
  assert.deepEqual(cleared, createEmptyVisitorFilters());
  assert.deepEqual(getVisitorFilterParams(cleared), {
    gender: undefined,
    job: undefined,
    location: undefined,
  });
});

test("calls the authenticated visitor list endpoint", async () => {
  const originalFetch = globalThis.fetch;
  const restoreSession = installAuthenticatedSession();
  let requestedUrl = "";
  let requestHeaders = new Headers();

  globalThis.fetch = async (input, init) => {
    requestedUrl =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    requestHeaders = new Headers(init?.headers);

    return new Response(JSON.stringify(visitorsResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const result = await getVisitors({
      gender: "male",
      location: "Damascus",
      page: 1,
      perPage: 15,
      search: "Mohamad",
    });
    const url = new URL(requestedUrl);

    assert.equal(url.pathname, "/api/v1/admin/visitor");
    assert.equal(url.searchParams.get("filter[search]"), "Mohamad");
    assert.equal(url.searchParams.get("filter[gender]"), "male");
    assert.equal(url.searchParams.get("filter[location]"), "Damascus");
    assert.equal(requestHeaders.get("Authorization"), "Bearer visitor-test-token");
    assert.deepEqual(result.visitors, visitorsResponse.data.data);
  } finally {
    globalThis.fetch = originalFetch;
    restoreSession();
  }
});

test("calls and maps the authenticated visitor statistics endpoint", async () => {
  const originalFetch = globalThis.fetch;
  const restoreSession = installAuthenticatedSession();
  let requestedUrl = "";
  let requestCache: RequestCache | undefined;
  let requestHeaders = new Headers();

  globalThis.fetch = async (input, init) => {
    requestedUrl =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    requestCache = init?.cache;
    requestHeaders = new Headers(init?.headers);

    return new Response(JSON.stringify(statisticsResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const statistics = await getVisitorStatistics();
    const url = new URL(requestedUrl);

    assert.equal(url.pathname, "/api/v1/admin/visitor/stats");
    assert.equal(url.search, "");
    assert.equal(requestCache, "no-store");
    assert.equal(requestHeaders.get("Authorization"), "Bearer visitor-test-token");
    assert.deepEqual(statistics, statisticsResponse.data);
    assert.deepEqual(
      normalizeVisitorStatisticsResponse(statisticsResponse),
      statisticsResponse.data,
    );
  } finally {
    globalThis.fetch = originalFetch;
    restoreSession();
  }
});
