"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSupabase } from "@/lib/supabase";

export async function createProperty(formData: FormData) {
  const code = formData.get("code") as string;
  const slug = formData.get("slug") as string;
  const title = formData.get("title") as string;
  const price = Number(formData.get("price")); 
  const transactionType = formData.get("transactionType") as string;
  const propertyType = formData.get("propertyType") as string;
  const generalLocation = formData.get("generalLocation") as string;

  const supabase = getSupabase();

  await supabase.from("properties").insert({
    id: crypto.randomUUID(),
    code,
    slug,
    title,
    price,
    transaction_type: transactionType,
    property_type: propertyType,
    general_location: generalLocation,
    publish_status: "draft", 
    availability_status: "available",
  });

  redirect("/admin/properti");
}

export async function togglePublishStatus(formData: FormData) {
  const propertyId = formData.get("propertyId") as string;
  const currentStatus = formData.get("currentStatus") as string;
  const newStatus = currentStatus === "published" ? "draft" : "published";

  const supabase = getSupabase();

  await supabase.from("properties")
    .update({ publish_status: newStatus })
    .eq("id", propertyId);

  revalidatePath(`/`);
  revalidatePath(`/admin/properti`);
  revalidatePath(`/admin/properti/${propertyId}`);
}

export async function updatePropertyAction(formData: FormData) {
  const propertyId = formData.get("propertyId") as string;
  
  const supabase = getSupabase();

  await supabase.from("properties").update({
    title: formData.get("title") as string,
    slug: formData.get("slug") as string,
    price: Number(formData.get("price")),
    general_location: formData.get("generalLocation") as string,
    public_summary: formData.get("publicSummary") as string,
    transaction_type: formData.get("transactionType") as string,
    property_type: formData.get("propertyType") as string,
    
    // MENYIMPAN SPESIFIKASI BARU
    bedrooms: Number(formData.get("bedrooms") || 0),
    bathrooms: Number(formData.get("bathrooms") || 0),
    land_area: Number(formData.get("landArea") || 0),
    building_area: Number(formData.get("buildingArea") || 0),
  }).eq("id", propertyId);

  revalidatePath(`/`);
  revalidatePath(`/admin/properti`);
  revalidatePath(`/admin/properti/${propertyId}`);
}

export async function hapusPropertiAction(formData: FormData) {
  const propertyId = formData.get("propertyId") as string;
  
  const supabase = getSupabase();

  // Hapus referensi media dari database terlebih dahulu (Mencegah error Foreign Key)
  await supabase.from("property_media").delete().eq("property_id", propertyId);
  
  // Kemudian hapus propertinya
  await supabase.from("properties").delete().eq("id", propertyId);
  
  // Catatan: Jika ingin lebih bersih, Anda bisa menambahkan fungsi penghapusan 
  // file fisik dari R2 di sini dengan cara melooping data file dari property_media 
  // sebelum menghapusnya dari database.

  revalidatePath("/admin/properti");
  revalidatePath("/");
}