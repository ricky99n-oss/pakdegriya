import { cache } from "react";
import { notFound } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { loadPublicProperties } from "@/lib/property-listing";
import { catalogPath, pageMetadata, propertyCategories, SITE_DESCRIPTION, type PropertyCategory } from "@/lib/seo";

export function parseCatalogPage(value?: string | string[]) {
  if (value === undefined) return 1;
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) notFound();
  return Number(value);
}
export const getCatalog = cache(async (category: PropertyCategory | undefined, page: number) => {
  const supabase = getSupabase();
  const { data, error, count } = await loadPublicProperties(supabase, { category, page });
  if (error) throw new Error("Katalog properti belum dapat dimuat.");
  const properties = data || [];
  if (page > 1 && properties.length === 0) notFound();
  const { data: covers } = properties.length ? await supabase.from("property_media").select("id, property_id")
    .in("property_id", properties.map((property) => property.id))
    .eq("file_type", "cover_public").eq("is_public", true).order("created_at", { ascending: false }) : { data: [] };
  return { total: count ?? properties.length, properties: properties.map((property) => ({ ...property, coverId: covers?.find((cover) => cover.property_id === property.id)?.id ?? null })) };
});
export async function catalogMetadata(category: PropertyCategory | undefined, page: number) {
  const { total } = await getCatalog(category, page);
  const title = category ? `${propertyCategories[category].label} Dijual & Disewakan di Batu dan Malang Raya` : "Katalog Properti Dijual & Disewakan di Batu dan Malang Raya";
  return { ...pageMetadata(`${title}${page > 1 ? ` — Halaman ${page}` : ""}`, category ? propertyCategories[category].description : SITE_DESCRIPTION, catalogPath(category, page)),
    robots: { index: total > 0, follow: true },
  };
}
