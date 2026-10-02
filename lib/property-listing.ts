import type { PropertyCategory } from "@/lib/seo";
import { getSupabase } from "@/lib/supabase";
import { isMissingPropertyFlags } from "@/lib/property-flags";

type PublicListing = {
  id: string; code: string; slug: string; title: string; price: number; propertyType: string;
  generalLocation: string; updatedAt: string; isHotItem?: boolean; isNegotiable?: boolean;
};
const fields = "id, code, slug, title, price, propertyType:property_type, generalLocation:general_location, updatedAt:updated_at";

export async function loadPublicProperties(supabase: ReturnType<typeof getSupabase>, options: { category?: PropertyCategory; page?: number } = {}) {
  const query = (withFlags: boolean) => {
    let request = supabase.from("properties")
      .select(withFlags ? `${fields}, isHotItem:is_hot_item, isNegotiable:is_negotiable` : fields, { count: "exact" })
      .eq("publish_status", "published");
    if (options.category) request = request.eq("property_type", options.category);
    if (withFlags) request = request.order("is_hot_item", { ascending: false });
    request = request.order("updated_at", { ascending: false }).order("id", { ascending: true });
    return (options.page ? request.range((options.page - 1) * 12, options.page * 12 - 1) : request.limit(6)).returns<PublicListing[]>();
  };
  const result = await query(true);
  if (!isMissingPropertyFlags(result.error)) return result;
  const legacy = await query(false);
  return { ...legacy, data: legacy.data?.map((property) => ({ ...property, isHotItem: false, isNegotiable: false })) ?? null };
}
