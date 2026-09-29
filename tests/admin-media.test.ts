import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/admin/media/route";
import { deleteMedia, updateMediaVisibility } from "@/lib/media-client";

const bucket = vi.hoisted(() => ({ delete: vi.fn() }));
vi.mock("@cloudflare/next-on-pages", () => ({ getRequestContext: () => ({ env: { R2_MEDIA_BUCKET: bucket } }) }));
type Row = Record<string, unknown>;
const state = vi.hoisted(() => ({
  admin: true,
  rows: {} as Record<string, Row[]>,
  writes: [] as string[],
  databaseError: null as { code: string; message: string } | null,
}));

vi.mock("@/lib/admin-auth", () => ({
  requireAdmin: async () => { if (!state.admin) throw new Error("UNAUTHORIZED"); },
  adminActionErrorMessage: (error: unknown) => error instanceof Error && error.message === "UNAUTHORIZED"
    ? "Sesi admin tidak valid atau sudah berakhir. Silakan masuk kembali."
    : "Terjadi kesalahan server. Silakan coba lagi.",
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase", () => ({
  getSupabaseAdmin: () => ({
    from: (table: string) => {
      let method = "select";
      let values: Row = {};
      const filters: Array<(row: Row) => boolean> = [];
      const execute = () => {
        if (state.databaseError) return { data: null, error: state.databaseError };
        const matches = state.rows[table].filter((row) => filters.every((filter) => filter(row)));
        if (method !== "select") state.writes.push(`${method}:${table}`);
        if (method === "insert") state.rows[table].push(values);
        if (method === "update") matches.forEach((row) => Object.assign(row, values));
        if (method === "delete") state.rows[table] = state.rows[table].filter((row) => !matches.includes(row));
        return { data: matches, error: null };
      };
      const query = {
        select: () => query,
        eq: (name: string, value: unknown) => { filters.push((row) => row[name] === value); return query; },
        in: (name: string, values: unknown[]) => { filters.push((row) => values.includes(row[name])); return query; },
        insert: (row: Row) => { method = "insert"; values = row; return query; },
        update: (row: Row) => { method = "update"; values = row; return query; },
        delete: () => { method = "delete"; return query; },
        maybeSingle: async () => { const result = execute(); return { ...result, data: result.data?.[0] ?? null }; },
        then: (resolve: (value: ReturnType<typeof execute>) => unknown) => Promise.resolve(execute()).then(resolve),
      };
      return query;
    },
  }),
}));


const propertyId = "11111111-1111-4111-8111-111111111111";
const mediaId = "22222222-2222-4222-8222-222222222222";
const otherId = "33333333-3333-4333-8333-333333333333";
const origin = "https://pakdegriya.test";
const fields = { propertyId, mediaId, makePublic: "true" };
const form = (values: Record<string, string> = fields) => {
  const data = new FormData();
  Object.entries(values).forEach(([key, value]) => data.set(key, value));
  return data;
};
const request = (operation = "updateVisibility", values: Record<string, string> = fields) => POST(new Request(`${origin}/api/admin/media`, {
  method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify({ operation, fields: values }),
}));

beforeEach(() => {
  vi.restoreAllMocks(); vi.unstubAllGlobals();
  state.admin = true; state.writes = []; state.databaseError = null;
  state.rows = { property_media: [{ id: mediaId, property_id: propertyId, file_name: "stored.jpg", preview_file_name: "stored-preview.jpg", is_public: false }] };
  bucket.delete.mockReset().mockResolvedValue(undefined);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("media JSON actions", () => {
  it("changes public/private status and deletes through client -> route -> database/R2", async () => {
    const fetchMock = vi.fn(async (url: string, init: RequestInit) => POST(new Request(new URL(url, origin), { ...init, headers: { ...init.headers, Origin: origin } })));
    vi.stubGlobal("fetch", fetchMock);
    expect(await updateMediaVisibility(form())).toMatchObject({ success: true });
    expect(state.rows.property_media[0].is_public).toBe(true);
    expect(await updateMediaVisibility(form({ ...fields, makePublic: "false" }))).toMatchObject({ success: true });
    expect(state.rows.property_media[0].is_public).toBe(false);
    expect(await deleteMedia(form({ propertyId, mediaId, fileName: "attacker-selected.jpg" }))).toMatchObject({ success: true });
    expect(state.rows.property_media).toEqual([]);
    expect(bucket.delete.mock.calls).toEqual([["stored.jpg"], ["stored-preview.jpg"]]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    for (const [url, init] of fetchMock.mock.calls) {
      expect(url).toBe("/api/admin/media");
      expect(init.headers).not.toHaveProperty("Next-Action");
    }
  });

  it.each(["deleteMedia", "updateVisibility"])("requires admin for %s", async (operation) => {
    state.admin = false;
    expect(await (await request(operation)).json()).toMatchObject({ success: false, error: expect.stringContaining("Sesi admin") });
    expect(state.writes).toEqual([]); expect(bucket.delete).not.toHaveBeenCalled();
  });

  it.each(["deleteMedia", "updateVisibility"])("does not touch another property's media during %s", async (operation) => {
    expect((await request(operation, { ...fields, propertyId: otherId })).status).toBe(400);
    expect(state.rows.property_media).toHaveLength(1);
    expect(state.rows.property_media[0].is_public).toBe(false);
    expect(bucket.delete).not.toHaveBeenCalled();
  });

  it.each(["", "yes", "1"])("rejects invalid visibility %s before writing", async (makePublic) => {
    expect((await request("updateVisibility", { ...fields, makePublic })).status).toBe(400);
    expect(state.writes).toEqual([]);
  });

  it("rejects invalid IDs, unknown operations, and malformed fields", async () => {
    expect((await request("deleteMedia", { ...fields, mediaId: "bad-id" })).status).toBe(400);
    expect((await request("constructor")).status).toBe(400);
    const response = await POST(new Request(`${origin}/api/admin/media`, { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify({ operation: "deleteMedia", fields: { mediaId: 123 } }) }));
    expect(response.status).toBe(400); expect(state.writes).toEqual([]);
  });

  it("rejects cross-origin, missing-origin, non-JSON and malformed JSON requests", async () => {
    for (const badOrigin of ["https://evil.test", "null", ""]) {
      expect((await POST(new Request(`${origin}/api/admin/media`, { method: "POST", headers: { Origin: badOrigin } }))).status).toBe(403);
    }
    expect((await POST(new Request(`${origin}/api/admin/media`, { method: "POST", headers: { Origin: origin, "Content-Type": "text/plain" } }))).status).toBe(415);
    expect((await POST(new Request(`${origin}/api/admin/media`, { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: "{" }))).status).toBe(400);
    expect(state.writes).toEqual([]);
  });

  it("accepts the incoming Host when Cloudflare reconstructs an internal request URL", async () => {
    const response = await POST(new Request("http://localhost:3000/api/admin/media", { method: "POST", headers: { Host: "pakdegriya.test", Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify({ operation: "updateVisibility", fields }) }));
    expect(response.status).toBe(200);
  });

  it("does not delete R2 objects if the database mutation fails", async () => {
    state.databaseError = { code: "42501", message: "denied" };
    const response = await request("deleteMedia");
    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toMatchObject({ success: false });
    expect(bucket.delete).not.toHaveBeenCalled();
  });

  it("does not report a completed metadata deletion as failed when R2 cleanup fails", async () => {
    bucket.delete.mockRejectedValue(new Error("R2 unavailable"));
    expect(await (await request("deleteMedia")).json()).toMatchObject({ success: true });
    expect(state.rows.property_media).toEqual([]);
  });

  it.each([deleteMedia, updateMediaVisibility])("reports HTTP errors without retrying writes", async (action) => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("not found", { status: 404 }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await action(form())).toMatchObject({ success: false, error: expect.stringContaining("HTTP 404") });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not duplicate writes after a network disconnect", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", fetchMock);
    expect(await deleteMedia(form())).toMatchObject({ success: false, error: expect.stringContaining("memeriksa hasil") });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
