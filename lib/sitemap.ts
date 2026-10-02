import type { MetadataRoute } from "next";
import { getSupabase } from "@/lib/supabase";
import { SITE_URL, catalogPath, isPropertyCategory, propertyPath } from "@/lib/seo";

export async function buildSitemap(supabase = getSupabase()): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = ["/", "/properti", "/tentang-kami", "/syarat-ketentuan"].map((path) => ({ url: `${SITE_URL}${path}` }));
  const categories = new Set<string>();
  // Supabase defaults to a row cap: read every published listing in stable batches.
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase.from("properties").select("id, slug, property_type, updated_at")
      .eq("publish_status", "published").order("id", { ascending: true }).range(offset, offset + 499);
    if (error || !data) throw new Error("Sitemap database unavailable");
    for (const property of data) {
      const date = property.updated_at ? new Date(property.updated_at) : null;
      entries.push({ url: `${SITE_URL}${propertyPath(property.slug)}`, ...(date && Number.isFinite(date.getTime()) ? { lastModified: date } : {}) });
      if (isPropertyCategory(property.property_type)) categories.add(property.property_type);
    }
    if (data.length < 500) break;
    // Avoid silently publishing a sitemap that exceeds the protocol limit.
    if (entries.length >= 49000) throw new Error("Split sitemap into multiple files before adding more listings");
  }
  for (const category of categories) if (isPropertyCategory(category)) entries.push({ url: `${SITE_URL}${catalogPath(category)}` });
  return entries;
}
