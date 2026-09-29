import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, HEAD, OPTIONS } from "@/app/api/media/[id]/route";

const context = vi.hoisted(() => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://fixture.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "fixture-anon-key",
    R2_MEDIA_BUCKET: { get: vi.fn(), head: vi.fn() },
  },
}));
vi.mock("@cloudflare/next-on-pages", () => ({ getRequestContext: () => context }));
// Regression guards: the image path must not import the full auth/profile/SDK graph.
vi.mock("@supabase/supabase-js", () => { throw new Error("Media must not initialize the Supabase SDK"); });
vi.mock("@/lib/auth", () => { throw new Error("Media must not load user profiles"); });

const id = "11111111-1111-4111-8111-111111111111";
const params = { params: Promise.resolve({ id }) };
const bucket = context.env.R2_MEDIA_BUCKET;
const media = { file_name: "master.png", preview_file_name: "preview.jpg", mime_type: "image/png", is_public: false };
const request = (headers: Record<string, string> = {}, query = "") => new Request(`https://pakdegriya.test/api/media/${id}${query}`, { headers });
const cookie = { cookie: "supabase_access_token=valid-token" };
const object = () => ({ body: new Response("image-bytes").body!, size: 11, httpEtag: '"etag"' });

function stubFetch(record: unknown = media, authStatus = 200, authBody: unknown = { id: "verified-user" }) {
  const fetchMock = vi.fn(async (input: string | URL) => {
    const url = new URL(String(input));
    if (url.pathname === "/rest/v1/property_media") return Response.json(record ? [record] : []);
    if (url.pathname === "/auth/v1/user") return Response.json(authBody, { status: authStatus });
    throw new Error(`Unexpected network request: ${url.pathname}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  bucket.get.mockReset().mockImplementation(async () => object());
  bucket.head.mockReset().mockResolvedValue({ size: 11, httpEtag: '"etag"' });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("lightweight private media access", () => {
  it("streams a private image using only metadata + verified Auth requests, no profile lookup", async () => {
    const fetchMock = stubFetch();
    const stored = object();
    bucket.get.mockResolvedValue(stored);
    const response = await GET(request(cookie), params);
    expect(response.status).toBe(200);
    expect(response.body).toBe(stored.body);
    expect(response.bodyUsed).toBe(false);
    expect(response.headers.get("x-media-size")).toBe("11");
    expect(response.headers.get("cache-control")).toContain("private, no-store");
    expect(response.headers.get("vary")).toContain("Cookie");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const metadataURL = new URL(String(fetchMock.mock.calls[0][0]));
    expect(metadataURL.searchParams.get("id")).toBe(`eq.${id}`);
    expect(metadataURL.searchParams.get("select")).toBe("file_name,preview_file_name,mime_type,is_public");
    expect(fetchMock).toHaveBeenNthCalledWith(2, "https://fixture.supabase.co/auth/v1/user", expect.objectContaining({
      cache: "no-store", headers: expect.objectContaining({ apikey: "fixture-anon-key", Authorization: "Bearer valid-token" }),
    }));
    expect(await response.text()).toBe("image-bytes");
  });

  it.each<Record<string, string>>([{}, { cookie: "other_supabase_access_token=forged" }, { cookie: "supabase_access_token=" }, { cookie: "supabase_access_token=%ZZ" }])("rejects missing or malformed cookies before opening R2: %j", async (headers) => {
    const fetchMock = stubFetch();
    expect((await GET(request(headers), params)).status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(bucket.get).not.toHaveBeenCalled();
  });

  it.each([401, 403])("rejects an expired / forged token (Auth %s) without leaking image bytes", async (status) => {
    stubFetch(media, status, { error: "invalid token" });
    const response = await GET(request(cookie), params);
    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(bucket.get).not.toHaveBeenCalled();
  });

  it("fails closed if Auth returns 200 without a verified user", async () => {
    stubFetch(media, 200, {});
    expect((await GET(request(cookie), params)).status).toBe(401);
    expect(bucket.get).not.toHaveBeenCalled();
  });

  it("handles Supabase's wrapped user response and encoded cookie", async () => {
    const fetchMock = stubFetch(media, 200, { user: { id: "verified-user" } });
    expect((await GET(request({ cookie: "other=1; supabase_access_token=encoded%2Etoken; extra=2" }), params)).status).toBe(200);
    expect(fetchMock).toHaveBeenLastCalledWith(expect.any(String), expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer encoded.token" }) }));
  });

  it("checks each user's session independently (no cross-request authorization cache)", async () => {
    const fetchMock = stubFetch();
    expect((await GET(request(cookie), params)).status).toBe(200);
    expect((await GET(request(), params)).status).toBe(401);
    expect(bucket.get).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it.each([GET, HEAD])("blocks access during Auth outages", async (handler) => {
    stubFetch(media, 503, { error: "unavailable" });
    expect((await handler(request(cookie), params)).status).toBe(500);
    expect(bucket.get).not.toHaveBeenCalled();
    expect(bucket.head).not.toHaveBeenCalled();
  });

  it("serves public media without any Auth call", async () => {
    const fetchMock = stubFetch({ ...media, is_public: true });
    const response = await GET(request(), params);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("public");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([null, "true", 1])("does not treat malformed is_public=%s as public", async (is_public) => {
    stubFetch({ ...media, is_public });
    expect((await GET(request(), params)).status).toBe(401);
    expect(bucket.get).not.toHaveBeenCalled();
  });
});

describe("R2 streaming and compatibility", () => {
  it("uses the JPEG preview when requested and streams the master otherwise", async () => {
    stubFetch();
    const preview = await GET(request(cookie, "?preview=1"), params);
    expect(preview.status).toBe(200);
    expect(preview.headers.get("content-type")).toBe("image/jpeg");
    expect(bucket.get).toHaveBeenLastCalledWith("preview.jpg");
    const master = await GET(request(cookie), params);
    expect(master.headers.get("content-type")).toBe("image/png");
    expect(bucket.get).toHaveBeenLastCalledWith("master.png");
  });

  it("keeps older panorama URLs working when no preview exists", async () => {
    stubFetch({ ...media, preview_file_name: null });
    const response = await GET(request(cookie, "?preview=1"), params);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(bucket.get).toHaveBeenCalledWith("master.png");
  });

  it("supports authenticated HEAD without reading the object body", async () => {
    stubFetch();
    const response = await HEAD(request(cookie, "?preview=1"), params);
    expect(response.status).toBe(200);
    expect(response.body).toBe(null);
    expect(response.headers.get("content-length")).toBe("11");
    expect(bucket.head).toHaveBeenCalledWith("preview.jpg");
    expect(bucket.get).not.toHaveBeenCalled();
  });

  it.each([["bytes=2-4", 2, 3, "bytes 2-4/11"], ["bytes=-3", 8, 3, "bytes 8-10/11"], ["bytes=8-", 8, 3, "bytes 8-10/11"]])("preserves Range streaming for %s", async (range, offset, length, contentRange) => {
    stubFetch();
    const response = await GET(request({ ...cookie, Range: String(range) }), params);
    expect(response.status).toBe(206);
    expect(response.headers.get("content-range")).toBe(contentRange);
    expect(response.headers.get("x-media-size")).toBe(String(length));
    expect(bucket.get).toHaveBeenCalledWith("master.png", { range: { offset, length } });
  });

  it("rejects invalid ranges without fetching the object body", async () => {
    stubFetch();
    expect((await GET(request({ ...cookie, Range: "bytes=100-200" }), params)).status).toBe(416);
    expect(bucket.get).not.toHaveBeenCalled();
  });

  it("returns 304 and releases the unused R2 stream", async () => {
    stubFetch();
    const cancel = vi.fn();
    bucket.get.mockResolvedValue({ ...object(), body: new ReadableStream({ cancel }) });
    const response = await GET(request({ ...cookie, "If-None-Match": '"etag"' }), params);
    expect(response.status).toBe(304);
    expect(response.body).toBe(null);
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it("returns 404 for missing metadata or objects", async () => {
    stubFetch(null);
    expect((await GET(request(cookie), params)).status).toBe(404);
    expect(bucket.get).not.toHaveBeenCalled();
    stubFetch();
    bucket.get.mockResolvedValue(null);
    expect((await GET(request(cookie), params)).status).toBe(404);
  });

  it("does not query Supabase for invalid IDs", async () => {
    const fetchMock = stubFetch();
    expect((await GET(request(cookie), { params: Promise.resolve({ id: "not-a-uuid" }) })).status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("handles metadata failures without returning file bytes", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ error: "unavailable" }, { status: 503 })));
    expect((await GET(request(cookie), params)).status).toBe(500);
    expect(bucket.get).not.toHaveBeenCalled();
  });

  it("answers preflight without database or R2 access", async () => {
    const fetchMock = stubFetch();
    expect((await OPTIONS()).status).toBe(204);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(bucket.get).not.toHaveBeenCalled();
  });
});
