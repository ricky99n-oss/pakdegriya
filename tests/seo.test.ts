import { beforeEach, describe, expect, it, vi } from "vitest";
import { SITE_URL, catalogPath, pageMetadata, propertyDescription, propertyPath, propertySchema, safeJsonLd, siteSchema } from "@/lib/seo";
import { buildSitemap } from "@/lib/sitemap";
import { getPublicProperty, getPublicCover } from "@/lib/public-property";
import { parseCatalogPage } from "@/lib/catalog";
import robots from "@/app/robots";
const state = vi.hoisted(() => ({ client: {} as unknown }));
vi.mock("@/lib/supabase", () => ({ getSupabase: () => state.client }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NEXT_NOT_FOUND"); } }));
function database(results: unknown[]) {
  const calls: unknown[][] = [];
  const query = {
    select: (value: string) => { calls.push(["select", value]); return query; },
    eq: (key: string, value: unknown) => { calls.push(["eq", key, value]); return query; },
    order: (key: string, value: unknown) => { calls.push(["order", key, value]); return query; },
    range: async (start: number, end: number) => { calls.push(["range", start, end]); return results.shift(); },
    limit: async (value: number) => { calls.push(["limit", value]); return results.shift(); },
  };
  const client = { from: (table: string) => { calls.push(["from", table]); return query; } };
  state.client = client;
  return { calls, client: client as unknown as Parameters<typeof buildSitemap>[0] };
}
beforeEach(() => { state.client = {}; });
const property = { id: "1", slug: "rumah-batu", title: "Rumah di Batu", public_summary: "Rumah dengan dua kamar.", general_location: "Batu", property_type: "rumah", transaction_type: "jual", price: 450000000 };

describe("SEO metadata", () => {
  it("sets absolute canonical and matching social metadata for each property", () => {
    const metadata = pageMetadata(property.title, propertyDescription(property), propertyPath(property.slug), `${SITE_URL}/api/media/cover`);
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/properti/rumah-batu`);
    expect(metadata.description).toContain("450.000.000");
    expect(metadata.openGraph).toMatchObject({ url: `${SITE_URL}/properti/rumah-batu`, images: [{ url: `${SITE_URL}/api/media/cover`, alt: property.title }] });
  });
  it("escapes JSON-LD so a listing cannot insert executable scripts", () => {
    const json = safeJsonLd({ title: '</script><script>alert(1)</script>' });
    expect(json).not.toContain("<");
    expect(JSON.parse(json).title).toBe('</script><script>alert(1)</script>');
  });
  it("uses real estate listing schema and correct rent period, without invented ratings", () => {
    const schema = propertySchema({ ...property, transaction_type: "sewa_bulan", price: 3000000 });
    expect(schema["@type"]).toBe("RealEstateListing");
    expect(schema.offers.priceSpecification).toMatchObject({ price: 3000000, priceCurrency: "IDR", unitText: "bulan" });
    expect(schema).not.toHaveProperty("aggregateRating");
    expect(siteSchema()["@graph"][1]).toMatchObject({ "@type": "RealEstateAgent", telephone: "+6285815999953" });
  });
  it("gives paginated catalogs their own canonical URL", () => {
    expect(catalogPath("tanah", 2)).toBe("/properti/kategori/tanah?page=2");
    expect(catalogPath(undefined, 1)).toBe("/properti");
    expect(parseCatalogPage("3")).toBe(3);
  });
  it.each(["0", "-1", "1.5", "bad", "9007199254740992"])("rejects invalid page %s", (page) => { expect(() => parseCatalogPage(page)).toThrow("NEXT_NOT_FOUND"); });
  it("keeps public images crawlable and announces the sitemap", () => {
    const config = robots();
    expect(config.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
    expect(config.rules).toMatchObject({ allow: "/", disallow: ["/admin/", "/api/admin/", "/properti/*/tour"] });
  });
});

describe("public-only SEO data", () => {
  it("filters published status when serving a detail page or its metadata", async () => {
    const db = database([{ data: [], error: null }]);
    expect(await getPublicProperty("draft-property")).toBeNull();
    expect(db.calls).toContainEqual(["eq", "publish_status", "published"]);
  });
  it("only uses publicly accessible cover media in Open Graph", async () => {
    const db = database([{ data: [{ id: "public-cover" }], error: null }]);
    expect(await getPublicCover("property-id")).toBe("public-cover");
    expect(db.calls).toContainEqual(["eq", "is_public", true]);
    expect(db.calls).toContainEqual(["eq", "file_type", "cover_public"]);
  });
  it("paginates the sitemap beyond the backend row cap and excludes empty categories", async () => {
    const batch = Array.from({ length: 500 }, (_, index) => ({ id: String(index), slug: `rumah-${index}`, property_type: "rumah", updated_at: "2026-10-02T00:00:00Z" }));
    const db = database([{ data: batch, error: null }, { data: [{ id: "500", slug: "tanah baru", property_type: "tanah", updated_at: null }], error: null }]);
    const sitemap = await buildSitemap(db.client);
    expect(db.calls).toContainEqual(["range", 500, 999]);
    expect(db.calls.filter((call) => call[0] === "eq")).toEqual([["eq", "publish_status", "published"], ["eq", "publish_status", "published"]]);
    expect(sitemap.some((entry) => entry.url === `${SITE_URL}/properti/tanah%20baru`)).toBe(true);
    expect(sitemap.some((entry) => entry.url.endsWith("/kategori/tanah"))).toBe(true);
    expect(sitemap.some((entry) => entry.url.endsWith("/kategori/ruko"))).toBe(false);
    expect(sitemap.some((entry) => /\/admin|\/auth|\/tour|\/profil/.test(entry.url))).toBe(false);
    expect(sitemap.find((entry) => entry.url.endsWith("rumah-0"))?.lastModified).toEqual(new Date("2026-10-02T00:00:00Z"));
  });
  it("fails on database errors rather than serving an incomplete sitemap as a success", async () => {
    const db = database([{ data: null, error: { message: "offline" } }]);
    await expect(buildSitemap(db.client)).rejects.toThrow("unavailable");
  });
});
