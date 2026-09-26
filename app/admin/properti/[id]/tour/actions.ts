"use server";
import { revalidatePath } from "next/cache";
import { getSupabase } from "@/lib/supabase";

export async function createSceneAction(formData: FormData) {
  const propertyId = formData.get("propertyId") as string;
  const mediaId = formData.get("mediaId") as string;
  const name = formData.get(`name_${mediaId}`) as string;

  if (!name || name.trim() === "") return;

  const supabase = getSupabase();

  // Cek apakah ini scene pertama yang dibuat
  const { data: existingScenes } = await supabase
    .from("scenes")
    .select("id")
    .eq("property_id", propertyId);
    
  const isFirst = !existingScenes || existingScenes.length === 0;

  await supabase.from("scenes").insert({
    id: crypto.randomUUID(),
    property_id: propertyId,
    media_id: mediaId,
    name: name.trim(),
    is_first_scene: isFirst,
  });

  revalidatePath(`/admin/properti/${propertyId}/tour`);
}

export async function createHotspotAction(formData: FormData) {
  const sceneId = formData.get("sceneId") as string;
  const targetSceneId = formData.get("targetSceneId") as string;
  const pitch = Number(formData.get("pitch"));
  const yaw = Number(formData.get("yaw"));
  const label = formData.get("label") as string;
  const propertyId = formData.get("propertyId") as string;

  const supabase = getSupabase();
  await supabase.from("hotspots").insert({
    id: crypto.randomUUID(),
    scene_id: sceneId,
    target_scene_id: targetSceneId,
    pitch,
    yaw,
    label,
  });

  revalidatePath(`/admin/properti/${propertyId}/tour`);
}

export async function deleteHotspotAction(formData: FormData) {
  const hotspotId = formData.get("hotspotId") as string;
  const propertyId = formData.get("propertyId") as string;

  const supabase = getSupabase();
  await supabase.from("hotspots").delete().eq("id", hotspotId);

  revalidatePath(`/admin/properti/${propertyId}/tour`);
}

export async function deleteSceneAction(formData: FormData) {
  const sceneId = formData.get("sceneId") as string;
  const propertyId = formData.get("propertyId") as string;

  const supabase = getSupabase();
  
  // Hapus semua hotspot yang terkait dengan scene ini terlebih dahulu
  await supabase.from("hotspots").delete().eq("scene_id", sceneId);
  await supabase.from("hotspots").delete().eq("target_scene_id", sceneId);
  
  // Baru hapus scene-nya
  await supabase.from("scenes").delete().eq("id", sceneId);

  revalidatePath(`/admin/properti/${propertyId}/tour`);
}

export async function setFirstSceneAction(formData: FormData) {
  const sceneId = formData.get("sceneId") as string;
  const propertyId = formData.get("propertyId") as string;

  const supabase = getSupabase();
  
  // Set semua scene di properti ini menjadi false
  await supabase.from("scenes").update({ is_first_scene: false }).eq("property_id", propertyId);
  
  // Jadikan scene yang dipilih menjadi true
  await supabase.from("scenes").update({ is_first_scene: true }).eq("id", sceneId);

  revalidatePath(`/admin/properti/${propertyId}/tour`);
}

export async function updateSceneNameAction(formData: FormData) {
  const sceneId = formData.get("sceneId") as string;
  const propertyId = formData.get("propertyId") as string;
  const name = formData.get("name") as string;

  const supabase = getSupabase();
  await supabase.from("scenes").update({ name }).eq("id", sceneId);
  
  revalidatePath(`/admin/properti/${propertyId}/tour`);
}

export async function updateSceneAudioAction(formData: FormData) {
  const sceneId = formData.get("sceneId") as string;
  const propertyId = formData.get("propertyId") as string;
  const audioMediaId = formData.get("audioMediaId") as string;

  const supabase = getSupabase();
  await supabase.from("scenes").update({
    audio_media_id: audioMediaId === "none" ? null : audioMediaId,
  }).eq("id", sceneId);

  revalidatePath(`/admin/properti/${propertyId}/tour`);
}

export async function setInitialViewAction(formData: FormData) {
  const sceneId = formData.get("sceneId") as string;
  const propertyId = formData.get("propertyId") as string;
  
  const pitch = formData.get("pitch") || formData.get("initialPitch");
  const yaw = formData.get("yaw") || formData.get("initialYaw");

  const supabase = getSupabase();
  await supabase.from("scenes").update({
    initial_pitch: Number(pitch),
    initial_yaw: Number(yaw),
  }).eq("id", sceneId);

  revalidatePath(`/admin/properti/${propertyId}/tour`);
}