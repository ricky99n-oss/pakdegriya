import { getSupabase } from "@/lib/supabase";
import { isMissingPropertyFlags } from "@/lib/property-flags";

const fields = "id, code, slug, title, price, propertyType:property_type, generalLocation:general_location, updatedAt:updated_at";

export async function loadPublicProperties(supabase: ReturnType<typeof getSupabase>) {
  const result = await supabase.from("properties")
    .select(`${fields}, isHotItem:is_hot_item, isNegotiable:is_negotiable`)
    .eq("publish_status", "published")
    .order("is_hot_item", { ascending: false })
    .order("updated_at", { ascending: false })
    .order("id", { ascending: true })
    .limit(6);
  if (!isMissingPropertyFlags(result.error)) return result;

  // Keep existing listings available while the additive migration is being applied.
  const legacy = await supabase.from("properties").select(fields)
    .eq("publish_status", "published")
    .order("updated_at", { ascending: false })
    .order("id", { ascending: true }).limit(6);
  return { ...legacy, data: legacy.data?.map((property) => ({ ...property, isHotItem: false, isNegotiable: false })) ?? null };
}
