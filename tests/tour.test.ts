import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/admin/tour/route";
import { createHotspot, deleteHotspot, setInitialView } from "@/lib/tour-client";

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
const sceneId = "22222222-2222-4222-8222-222222222222";
const targetSceneId = "33333333-3333-4333-8333-333333333333";
const otherPropertyId = "44444444-4444-4444-8444-444444444444";
const origin = "https://pakdegriya.test";
const fields = { propertyId, sceneId, targetSceneId, pitch: "1.53", yaw: "41.05", label: "Menuju Dapur", iconType: "door" };
const form = (values: Record<string, string> = fields) => {
  const result = new FormData();
  Object.entries(values).forEach(([key, value]) => result.set(key, value));
  return result;
};

beforeEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  state.admin = true;
  state.writes = [];
  state.databaseError = null;
  state.rows = {
    scenes: [{ id: sceneId, property_id: propertyId }, { id: targetSceneId, property_id: propertyId }],
    hotspots: [],
  };
  vi.spyOn(console, "error").mockImplementation(() => {});
});

async function request(operation = "createHotspot", values: Record<string, string> = fields) {
  return POST(new Request(`${origin}/api/admin/tour`, {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify({ operation, fields: values }),
  }));
}

function connectClientToRoute() {
  return vi.fn(async (url: string, init: RequestInit) => POST(new Request(new URL(url, origin), {
    ...init,
    headers: { ...init.headers, Origin: origin },
  })));
}

describe("tour JSON mutations", () => {
  it("saves the screenshot coordinates through client -> API -> database, without Next-Action", async () => {
    const fetchMock = connectClientToRoute();
    vi.stubGlobal("fetch", fetchMock);
    expect(await createHotspot(form())).toMatchObject({ success: true });
    expect(state.rows.hotspots).toEqual([expect.objectContaining({ scene_id: sceneId, target_scene_id: targetSceneId, pitch: 1.53, yaw: 41.05, label: "Menuju Dapur|||door" })]);
    expect(state.writes).toEqual(["insert:hotspots"]);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" } });
    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty("Next-Action");
  });

  it.each(["door", "arrow", "thumbnail"])("preserves %s icon metadata", async (iconType) => {
    expect((await request("createHotspot", { ...fields, iconType })).status).toBe(200);
    expect(state.rows.hotspots[0].label).toBe(`Menuju Dapur|||${iconType}`);
  });

  it.each([["0", "0"], ["-90", "-180"], ["90", "180"]])("accepts valid boundaries %s / %s", async (pitch, yaw) => {
    expect((await request("createHotspot", { ...fields, pitch, yaw })).status).toBe(200);
    expect(state.rows.hotspots[0]).toMatchObject({ pitch: Number(pitch), yaw: Number(yaw) });
  });

  it.each([["", "41"], [" ", "0"], ["1", ""], ["NaN", "0"], ["1", "Infinity"], ["91", "0"], ["0", "181"]])("rejects invalid coordinates %s / %s without writing", async (pitch, yaw) => {
    expect((await request("createHotspot", { ...fields, pitch, yaw })).status).toBe(400);
    expect(state.writes).toEqual([]);
  });

  it("rejects omitted coordinates instead of silently storing zero", async () => {
    const missing = { ...fields };
    delete (missing as Partial<typeof fields>).pitch;
    expect((await request("createHotspot", missing)).status).toBe(400);
    expect(state.writes).toEqual([]);
  });

  it.each(["createHotspot", "setInitialView", "deleteHotspot", "updateSceneAudio"])("requires admin for %s", async (operation) => {
    state.admin = false;
    const response = await request(operation);
    expect(await response.json()).toMatchObject({ success: false, error: expect.stringContaining("Sesi admin") });
    expect(state.writes).toEqual([]);
  });

  it("rejects a target in another property or the same room", async () => {
    state.rows.scenes[1].property_id = otherPropertyId;
    expect((await request()).status).toBe(400);
    expect((await request("createHotspot", { ...fields, targetSceneId: sceneId })).status).toBe(400);
    expect(state.writes).toEqual([]);
  });

  it("saves an initial view and deletes a newly saved hotspot through JSON", async () => {
    vi.stubGlobal("fetch", connectClientToRoute());
    expect(await setInitialView(form({ propertyId, sceneId, pitch: "0", yaw: "-12.5" }))).toMatchObject({ success: true });
    expect(state.rows.scenes[0]).toMatchObject({ initial_pitch: 0, initial_yaw: -12.5 });
    expect(await createHotspot(form())).toMatchObject({ success: true });
    const hotspotId = String(state.rows.hotspots[0].id);
    expect(await deleteHotspot(form({ propertyId, hotspotId }))).toMatchObject({ success: true });
    expect(state.rows.hotspots).toEqual([]);
  });

  it("does not update or delete records through the wrong property", async () => {
    await request();
    const hotspotId = String(state.rows.hotspots[0].id);
    state.writes = [];
    expect((await request("setInitialView", { ...fields, propertyId: otherPropertyId })).status).toBe(400);
    expect((await request("deleteHotspot", { propertyId: otherPropertyId, hotspotId })).status).toBe(400);
    expect(state.rows.scenes[0]).not.toHaveProperty("initial_pitch");
    expect(state.rows.hotspots).toHaveLength(1);
  });

  it("saves selected audio and automatic/silent modes with property validation", async () => {
    const audioId = "55555555-5555-4555-8555-555555555555";
    state.rows.property_media = [{ id: audioId, property_id: propertyId, file_type: "audio_private" }];
    expect((await request("updateSceneAudio", { propertyId, sceneId, audioMediaId: audioId })).status).toBe(200);
    expect(state.rows.scenes[0].audio_media_id).toBe(audioId);
    expect((await request("updateSceneAudio", { propertyId, sceneId, audioMediaId: "none" })).status).toBe(200);
    expect(state.rows.scenes[0].audio_media_id).toBe("none");
    expect((await request("updateSceneAudio", { propertyId, sceneId, audioMediaId: "auto" })).status).toBe(200);
    expect(state.rows.scenes[0].audio_media_id).toBe(null);
    state.rows.property_media[0].property_id = otherPropertyId;
    expect((await request("updateSceneAudio", { propertyId, sceneId, audioMediaId: audioId })).status).toBe(400);
    expect(state.rows.scenes[0].audio_media_id).toBe(null);
    expect((await request("updateSceneAudio", { propertyId: otherPropertyId, sceneId, audioMediaId: "none" })).status).toBe(400);
  });

  it("returns database errors as JSON and does not claim success", async () => {
    state.databaseError = { code: "42501", message: "permission denied" };
    const response = await request();
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toMatchObject({ success: false, error: expect.stringContaining("Database menolak") });
  });

  it("rejects cross-origin and malformed requests without mutations", async () => {
    for (const badOrigin of ["https://evil.test", "null", ""]) {
      expect((await POST(new Request(`${origin}/api/admin/tour`, { method: "POST", headers: { Origin: badOrigin } }))).status).toBe(403);
    }
    expect((await POST(new Request(`${origin}/api/admin/tour`, { method: "POST", headers: { Origin: origin, "Content-Type": "text/plain" } }))).status).toBe(415);
    expect((await POST(new Request(`${origin}/api/admin/tour`, { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: "{" }))).status).toBe(400);
    expect((await request("constructor")).status).toBe(400);
    expect(state.writes).toEqual([]);
  });

  it("uses the incoming Host when the Edge adapter supplies an internal URL", async () => {
    const response = await POST(new Request("http://localhost:3000/api/admin/tour", {
      method: "POST",
      headers: { Host: "pakdegriya.test", Origin: origin, "Content-Type": "application/json" },
      body: JSON.stringify({ operation: "createHotspot", fields }),
    }));
    expect(response.status).toBe(200);
    expect(state.rows.hotspots).toHaveLength(1);
  });
});

describe("transport error feedback", () => {
  it("shows HTTP status for an HTML error and never retries the write", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("<html>Server error</html>", { status: 502, headers: { "Content-Type": "text/html" } }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await createHotspot(form())).toMatchObject({ success: false, error: expect.stringContaining("HTTP 502") });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("preserves actionable server errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ success: false, error: "Sesi admin berakhir." }, { status: 401 })));
    expect(await createHotspot(form())).toEqual({ success: false, error: "Sesi admin berakhir." });
  });

  it("handles connection loss without a duplicate write", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", fetchMock);
    expect(await createHotspot(form())).toMatchObject({ success: false, error: expect.stringContaining("memeriksa hasil") });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
