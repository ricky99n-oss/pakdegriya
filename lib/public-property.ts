import { cache } from "react";
import { getSupabase } from "@/lib/supabase";

// Shared by metadata and the page within the same request; never expose drafts.
export const getPublicProperty = cache(async (slug: string) => {
  const { data, error } = await getSupabase().from("properties").select("*")
    .eq("slug", slug).eq("publish_status", "published").limit(1);
  if (error) throw new Error("Gagal memuat properti publik.");
  return data?.[0] ?? null;
});
export const getPublicCover = cache(async (propertyId: string) => {
  const { data, error } = await getSupabase().from("property_media").select("id")
    .eq("property_id", propertyId).eq("file_type", "cover_public").eq("is_public", true)
    .order("created_at", { ascending: false }).limit(1);
  if (error) return null;
  return data?.[0]?.id ?? null;
});
