import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/admin/properties/route";
import { setPublishStatus, updateProperty } from "@/lib/property-client";
import { updatePropertyAction } from "@/app/admin/properti/actions";
import { revalidatePath } from "next/cache";

const propertyId = "d3966a45-feb6-4dd3-b5f6-c6205cb804e8";
const origin = "https://pakdegriya.test";
const state = vi.hoisted(() => ({
  admin: true,
  row: null as Record<string, unknown> | null,
  writes: 0,
  databaseError: null as { code: string; message: string } | null,
  adminClient: vi.fn(),
}));
vi.mock("@/lib/admin-auth", () => ({
  requireAdmin: async () => { if (!state.admin) throw new Error("UNAUTHORIZED"); },
  adminActionErrorMessage: (error: unknown) => error instanceof Error && error.message === "UNAUTHORIZED"
    ? "Sesi admin tidak valid atau sudah berakhir. Silakan masuk kembali."
    : "Terjadi kesalahan server.",
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase", () => ({
  getSupabase: () => { throw new Error("Anonymous client must not be used for updates"); },
  getSupabaseAdmin: () => {
    state.adminClient();
    return { from: (table: string) => {
      expect(table).toBe("properties");
      let values: Record<string, unknown> = {};
      let id: unknown;
      const query = {
        insert: async (payload: Record<string, unknown>) => {
          if (state.databaseError) return { error: state.databaseError };
          state.writes++; state.row = payload; return { error: null };
        },
        update: (payload: Record<string, unknown>) => { values = payload; return query; },
        eq: (key: string, value: unknown) => { expect(key).toBe("id"); id = value; return query; },
        select: () => query,
        maybeSingle: async () => {
          if (state.databaseError) return { data: null, error: state.databaseError };
          if (!state.row || state.row.id !== id) return { data: null, error: null };
          state.writes++;
          Object.assign(state.row, values);
          return { data: { id }, error: null };
        },
      };
      return query;
    } };
  },
}));
const fields = {
  propertyId, title: "Rumah Kost Full Furnished", slug: "kost-batu", price: "800000000",
  generalLocation: "Batu, Jawa Timur", transactionType: "jual", propertyType: "rumah",
  bedrooms: "7", bathrooms: "7", landArea: "62", buildingArea: "180", publicSummary: "Kost siap huni.",
};
const form = (overrides: Record<string, string> = {}) => {
  const data = new FormData();
  Object.entries({ ...fields, ...overrides }).forEach(([key, value]) => data.set(key, value));
  return data;
};
const request = (body: unknown = { operation: "updateProperty", fields }, headers: Record<string, string> = {}) => POST(new Request(`${origin}/api/admin/properties`, {
  method: "POST", headers: { Origin: origin, "Content-Type": "application/json", ...headers }, body: JSON.stringify(body),
}));
beforeEach(() => {
  vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.mocked(revalidatePath).mockReset(); state.adminClient.mockClear();
  state.admin = true; state.databaseError = null; state.writes = 0;
  state.row = { id: propertyId, price: 900000000, code: "PG-001", publish_status: "published" };
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("property price saving", () => {
  it.each(["800000000", "3500000000", "0"])("saves %s via client -> JSON route -> authenticated database update", async (price) => {
    const fetchMock = vi.fn(async (url: string, init: RequestInit) => POST(new Request(new URL(url, origin), { ...init, headers: { ...init.headers, Origin: origin } })));
    vi.stubGlobal("fetch", fetchMock);
    expect(await updateProperty(form({ price }))).toMatchObject({ success: true });
    expect(state.row).toMatchObject({ price: Number(price), bedrooms: 7, bathrooms: 7, land_area: 62, building_area: 180, code: "PG-001", publish_status: "published" });
    expect(state.writes).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/admin/properties");
    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty("Next-Action");
    expect(revalidatePath).toHaveBeenCalledWith(`/admin/properti/${propertyId}`);
    expect(revalidatePath).toHaveBeenCalledWith("/properti/[slug]", "page");
  });
  it("checks admin before creating the privileged database client", async () => {
    state.admin = false;
    expect(await (await request()).json()).toMatchObject({ success: false, error: expect.stringContaining("Sesi admin") });
    expect(state.adminClient).not.toHaveBeenCalled(); expect(state.writes).toBe(0);
  });
  it.each(["", " ", "NaN", "Infinity", "-1", "800.000.000", "9007199254740992"])("rejects invalid price %s without changing stored data", async (price) => {
    expect(await updatePropertyAction(form({ price }))).toMatchObject({ success: false, error: expect.stringContaining("Harga") });
    expect(state.row?.price).toBe(900000000); expect(state.adminClient).not.toHaveBeenCalled();
  });
  it("rejects a missing price instead of silently saving zero", async () => {
    const data = form(); data.delete("price");
    expect(await updatePropertyAction(data)).toMatchObject({ success: false });
    expect(state.writes).toBe(0);
  });
  it.each([["bedrooms", "1.5"], ["bathrooms", "NaN"], ["landArea", "-1"], ["buildingArea", "Infinity"], ["propertyId", "bad"], ["transactionType", "invalid"]])("rejects malformed property field %s=%s", async (key, value) => {
    expect(await updatePropertyAction(form({ [key]: value }))).toMatchObject({ success: false });
    expect(state.writes).toBe(0);
  });
  it("reports no matching row as failure", async () => {
    state.row = null;
    expect(await (await request()).json()).toMatchObject({ success: false, error: expect.stringContaining("tidak ditemukan") });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
  it.each(["23505", "42501"])("returns an actionable database error for %s", async (code) => {
    state.databaseError = { code, message: "internal database detail" };
    const response = await request();
    expect(response.status).toBe(400);
    const result = await response.json();
    expect(result.success).toBe(false); expect(result.error).not.toContain("internal database detail");
    if (code === "23505") expect(result.error).toContain("Slug URL");
    expect(state.writes).toBe(0);
  });
  it("does not report a committed save as failed if cache invalidation throws", async () => {
    vi.mocked(revalidatePath).mockImplementation(() => { throw new Error("cache unavailable"); });
    expect(await (await request()).json()).toMatchObject({ success: true, message: expect.stringContaining("tersimpan") });
    expect(state.row?.price).toBe(800000000); expect(state.writes).toBe(1);
  });
  it("rejects cross-origin, absent-origin, non-JSON, unknown operation and malformed fields", async () => {
    for (const Origin of ["https://evil.test", "null", ""]) expect((await request(undefined, { Origin })).status).toBe(403);
    expect((await request(undefined, { "Content-Type": "text/plain" })).status).toBe(415);
    for (const body of [null, [], { operation: "deleteProperty", fields }, { operation: "updateProperty", fields: { price: 800000000 } }]) {
      expect((await request(body)).status).toBe(400);
    }
    expect((await POST(new Request(`${origin}/api/admin/properties`, { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: "{" }))).status).toBe(400);
    expect(state.writes).toBe(0);
  });
  it("supports the forwarded public Host used by the Cloudflare adapter", async () => {
    const response = await POST(new Request("http://localhost:3000/api/admin/properties", { method: "POST", headers: { Host: "pakdegriya.test", Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify({ operation: "updateProperty", fields }) }));
    expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it("reports an HTML/proxy error without retrying the write", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("<html>Error</html>", { status: 502 }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await updateProperty(form())).toMatchObject({ success: false, error: expect.stringContaining("HTTP 502") });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("does not retry after a disconnect because the save may have succeeded", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("Failed to fetch")); vi.stubGlobal("fetch", fetchMock);
    expect(await updateProperty(form())).toMatchObject({ success: false, error: expect.stringContaining("memeriksa hasil") });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("property publication", () => {
  const publishRequest = (overrides: Record<string, string> = {}, headers: Record<string, string> = {}) =>
    request({ operation: "setPublishStatus", fields: { propertyId, publishStatus: "published", ...overrides } }, headers);

  it.each(["published", "draft"])("sets %s through the JSON client and keeps retries in the same state", async (publishStatus) => {
    const fetchMock = vi.fn(async (url: string, init: RequestInit) => POST(new Request(new URL(url, origin), { ...init, headers: { ...init.headers, Origin: origin } })));
    vi.stubGlobal("fetch", fetchMock);
    state.row!.publish_status = publishStatus === "published" ? "draft" : "published";
    const data = new FormData();
    data.set("propertyId", propertyId); data.set("publishStatus", publishStatus);
    for (let attempt = 0; attempt < 2; attempt++) {
      expect(await setPublishStatus(data)).toMatchObject({ success: true });
      expect(state.row).toMatchObject({ publish_status: publishStatus, price: 900000000, code: "PG-001" });
    }
    expect(fetchMock.mock.calls[0][0]).toBe("/api/admin/properties");
    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty("Next-Action");
    expect(state.row?.updated_at).toEqual(expect.any(String));
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith(`/admin/properti/${propertyId}`);
    expect(revalidatePath).toHaveBeenCalledWith("/admin/dashboard");
    expect(revalidatePath).toHaveBeenCalledWith("/properti/[slug]", "layout");
  });
  it("rejects an expired or non-admin session before obtaining database privileges", async () => {
    state.admin = false;
    expect(await (await publishRequest()).json()).toMatchObject({ success: false, error: expect.stringContaining("Sesi admin") });
    expect(state.adminClient).not.toHaveBeenCalled();
  });
  it.each([["propertyId", "bad"], ["propertyId", ""], ["publishStatus", ""], ["publishStatus", "public"]])("rejects invalid publication field %s=%s", async (key, value) => {
    expect((await publishRequest({ [key]: value })).status).toBe(400);
    expect(state.adminClient).not.toHaveBeenCalled();
  });
  it("rejects cross-origin requests before writing", async () => {
    expect((await publishRequest({}, { Origin: "https://evil.test" })).status).toBe(403);
    expect(state.writes).toBe(0);
  });
  it("does not report success for a missing property", async () => {
    state.row = null;
    expect(await (await publishRequest()).json()).toMatchObject({ success: false, error: expect.stringContaining("tidak ditemukan") });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
  it("reports database failure without exposing internal details", async () => {
    state.databaseError = { code: "42501", message: "internal database detail" };
    expect(await (await publishRequest()).json()).toEqual({ success: false, error: "Status publikasi gagal disimpan ke database. Silakan coba lagi." });
    expect(state.writes).toBe(0);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
  it("reports a committed status even when cache invalidation fails", async () => {
    vi.mocked(revalidatePath).mockImplementation(() => { throw new Error("cache unavailable"); });
    expect(await (await publishRequest()).json()).toMatchObject({ success: true, message: expect.stringContaining("tersimpan") });
    expect(state.row?.publish_status).toBe("published");
    expect(state.writes).toBe(1);
  });
});


describe("Hot Item and Nego settings", () => {
  it.each(["true", "false"])("saves explicit flags %s through the protected endpoint", async (value) => {
    const response = await request({ operation: "updateProperty", fields: { ...fields, isHotItem: value, isNegotiable: value } });
    expect(response.status).toBe(200);
    expect(state.row).toMatchObject({ is_hot_item: value === "true", is_negotiable: value === "true", price: 800000000 });
  });
  it("preserves flags when an older form omits them", async () => {
    Object.assign(state.row!, { is_hot_item: true, is_negotiable: true });
    await request();
    expect(state.row).toMatchObject({ is_hot_item: true, is_negotiable: true });
  });
  it("rejects malformed booleans without writing", async () => {
    expect((await request({ operation: "updateProperty", fields: { ...fields, isHotItem: "yes" } })).status).toBe(400);
    expect(state.writes).toBe(0);
  });
  it("creates a draft with both options through JSON", async () => {
    const response = await request({ operation: "createProperty", fields: { ...fields, code: "PG-NEW", isHotItem: "true", isNegotiable: "true" } });
    expect(response.status).toBe(200);
    expect(state.row).toMatchObject({ code: "PG-NEW", price: 800000000, is_hot_item: true, is_negotiable: true, publish_status: "draft" });
  });
  it("requires admin for creation before accessing the privileged client", async () => {
    state.admin = false;
    expect((await request({ operation: "createProperty", fields: { ...fields, code: "PG-NEW" } })).status).toBe(400);
    expect(state.adminClient).not.toHaveBeenCalled();
  });
  it("explains the required migration rather than reporting a successful save", async () => {
    state.databaseError = { code: "PGRST204", message: "Could not find the is_hot_item column" };
    const response = await request({ operation: "updateProperty", fields: { ...fields, isHotItem: "true" } });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ success: false, error: expect.stringContaining("pembaruan database") });
    expect(state.writes).toBe(0);
  });
});
