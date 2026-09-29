import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, PATCH } from "@/app/api/admin/members/route";
import { loadAllMembers } from "@/lib/member-client";
import { normalizeMemberPhone } from "@/lib/members";
const state = vi.hoisted(() => ({ role: "admin", rows: [] as Record<string, unknown>[], writes: [] as unknown[], dbError: false, calls: 0 }));
vi.mock("@/lib/auth", () => ({ validateRequest: async () => ({ user: state.role ? { id: "admin", role: state.role } : null }) }));
vi.mock("@/lib/supabase", () => ({ getSupabaseAdmin: () => ({ from: () => {
  state.calls++;
  let fields: string[] = []; let update: Record<string, unknown> | undefined; const filters: Array<(r: Record<string, unknown>) => boolean> = [];
  const execute = (start = 0, end = 999) => {
    if (state.dbError) return { data: null, count: null, error: new Error("Database unavailable") };
    const matches = state.rows.filter((row) => filters.every((filter) => filter(row)));
    if (update) { state.writes.push(update); matches.forEach((row) => Object.assign(row, update)); }
    return { data: matches.slice(start, end + 1).map((row) => Object.fromEntries(fields.map((field) => [field, row[field]]))), count: matches.length, error: null };
  };
  const query = { select: (columns: string) => { fields = columns.split(","); return query; }, order: () => query,
    eq: (field: string, value: unknown) => { filters.push((row) => row[field] === value); return query; },
    or: (expression: string) => { const q = expression.split("%")?.[1] || ""; filters.push((row) => ["name", "email", "phone"].some((field) => String(row[field]).toLowerCase().includes(q.toLowerCase()))); return query; },
    range: async (start: number, end: number) => execute(start, end),
    update: (value: Record<string, unknown>) => { update = value; return query; },
    maybeSingle: async () => { const result = execute(); return { ...result, data: result.data?.[0] || null }; },
  }; return query;
} }) }));
const origin = "https://pakdegriya.test";
const patch = (body: unknown, requestOrigin = origin) => PATCH(new Request(`${origin}/api/admin/members`, { method: "PATCH", headers: { Origin: requestOrigin, "Content-Type": "application/json" }, body: JSON.stringify(body) }));
beforeEach(() => {
  vi.restoreAllMocks(); vi.unstubAllGlobals();
  state.role = "admin"; state.writes = []; state.calls = 0; state.dbError = false;
  state.rows = Array.from({ length: 205 }, (_, index) => ({ id: String(index), name: `Member ${index}`, email: `member${index}@example.test`, phone: "+628123456789", role: "member", created_at: "2026-09-29T10:00:00Z", password_hash: "never-export-this" }));
  vi.spyOn(console, "error").mockImplementation(() => {});
});
describe("member administration", () => {
  it.each(["", "member"])("denies reads and edits to role %s", async (role) => {
    state.role = role;
    expect((await GET(new Request(`${origin}/api/admin/members`))).status).toBe(401);
    expect((await patch({ id: "0", name: "Changed", phone: "08123456789" })).status).toBe(401);
    expect(state.calls).toBe(0); expect(state.writes).toEqual([]);
  });
  it("paginates and exposes only profile fields, with no private response cache", async () => {
    const result = await GET(new Request(`${origin}/api/admin/members?page=2&pageSize=200`));
    const body = await result.json();
    expect(body.members).toHaveLength(5); expect(body.total).toBe(205);
    expect(body.members[0]).not.toHaveProperty("password_hash");
    expect(result.headers.get("cache-control")).toContain("no-store");
  });
  it("filters name/email/WhatsApp and role", async () => {
    const result = await GET(new Request(`${origin}/api/admin/members?q=member204&role=member`));
    expect((await result.json()).members).toHaveLength(1);
  });
  it("normalizes WhatsApp while ignoring attempts to change email/role/password", async () => {
    const result = await patch({ id: "0", name: "Ricky", phone: "0812-3456-789", role: "superadmin", email: "attacker@example.test", password_hash: "evil" });
    expect(result.status).toBe(200);
    expect(state.writes).toEqual([{ name: "Ricky", phone: "+628123456789" }]);
    expect(state.rows[0].role).toBe("member");
  });
  it("rejects cross-origin edits and invalid input", async () => {
    expect((await patch({ id: "0", name: "Ricky", phone: "08123456789" }, "https://evil.test")).status).toBe(403);
    expect((await patch({ id: "0", name: "", phone: "123" })).status).toBe(400);
    expect(state.writes).toEqual([]);
  });
  it("returns missing records and database failures explicitly", async () => {
    expect((await patch({ id: "missing", name: "Ricky", phone: "08123456789" })).status).toBe(404);
    state.dbError = true;
    expect((await GET(new Request(`${origin}/api/admin/members`))).status).toBe(500);
  });
  it("exports all matching pages rather than stopping at the first page", async () => {
    const fetchMock = vi.fn((url: string) => GET(new Request(new URL(url, origin)))); vi.stubGlobal("fetch", fetchMock);
    const rows = await loadAllMembers("", "member");
    expect(rows).toHaveLength(205); expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(rows.every((row) => !("password_hash" in row))).toBe(true);
  });
  it("fails export if a later page fails, instead of downloading an incomplete list", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(Response.json({ members: state.rows.slice(0, 200), total: 205 })).mockResolvedValueOnce(Response.json({ error: "Session expired" }, { status: 401 })); vi.stubGlobal("fetch", fetchMock);
    await expect(loadAllMembers("", "")).rejects.toThrow("Session expired");
  });
  it("accepts local and international-format Indonesian numbers", () => {
    expect(normalizeMemberPhone("08123456789")).toBe("+628123456789");
    expect(normalizeMemberPhone("+62 8123456789")).toBe("+628123456789");
    expect(normalizeMemberPhone("123")).toBe(null);
  });
});
