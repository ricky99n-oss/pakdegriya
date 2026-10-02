import { describe, expect, it, vi } from "vitest";
import { loadPublicProperties } from "@/lib/property-listing";
vi.mock("@/lib/supabase", () => ({ getSupabase: vi.fn() }));

function database(results: unknown[]) {
  const queries: unknown[][] = [];
  return {
    queries,
    client: { from: (table: string) => {
      const calls: unknown[] = [["from", table]]; queries.push(calls);
      const query = {
        select: (value: string) => { calls.push(["select", value]); return query; },
        eq: (key: string, value: unknown) => { calls.push(["eq", key, value]); return query; },
        order: (key: string, options: unknown) => { calls.push(["order", key, options]); return query; },
        limit: async (value: number) => { calls.push(["limit", value]); return results.shift(); },
      }; return query;
    } } as unknown as Parameters<typeof loadPublicProperties>[0],
  };
}
it("prioritizes Hot Item in the database before limiting published listings", async () => {
  const db = database([{ data: [], error: null }]);
  await loadPublicProperties(db.client);
  expect(db.queries[0].slice(2)).toEqual([
    ["eq", "publish_status", "published"],
    ["order", "is_hot_item", { ascending: false }],
    ["order", "updated_at", { ascending: false }],
    ["order", "id", { ascending: true }], ["limit", 6],
  ]);
});
describe("migration compatibility", () => {
  it("keeps legacy listings available when the new columns do not exist", async () => {
    const db = database([{ data: null, error: { code: "42703", message: "column properties.is_hot_item does not exist" } }, { data: [{ id: "old" }], error: null }]);
    expect((await loadPublicProperties(db.client)).data).toEqual([{ id: "old", isHotItem: false, isNegotiable: false }]);
    expect(db.queries).toHaveLength(2);
  });
  it("does not hide unrelated database failures", async () => {
    const error = { code: "42501", message: "permission denied" };
    const db = database([{ data: null, error }]);
    expect((await loadPublicProperties(db.client)).error).toEqual(error);
    expect(db.queries).toHaveLength(1);
  });
});
