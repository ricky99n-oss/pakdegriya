"use server";

import { revalidatePath } from "next/cache";
import { getSupabase } from "@/lib/supabase";
import { requireAdmin, adminActionErrorMessage } from "@/lib/admin-auth";
import { actionError, actionSuccess, type AdminActionResult } from "@/lib/admin-action";

function tourPath(propertyId: string) {
  return `/admin/properti/${propertyId}/tour`;
}

async function getOrderedScenes(propertyId: string) {
  const { data, error } = await getSupabase()
    .from("scenes")
    .select("id, sort_order, created_at")
    .eq("property_id", propertyId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

async function persistOrder(propertyId: string, orderedIds: string[]) {
  const supabase = getSupabase();
  const reset = await supabase.from("scenes").update({ is_first_scene: false }).eq("property_id", propertyId);
  if (reset.error) throw reset.error;
  const results = await Promise.all(orderedIds.map((id, index) =>
    supabase.from("scenes").update({ sort_order: index, is_first_scene: index === 0 }).eq("id", id)
  ));
  const failed = results.find((result) => result.error);
  if (failed?.error) throw failed.error;
}

async function normalizeSceneOrder(propertyId: string) {
  const scenes = await getOrderedScenes(propertyId);
  await persistOrder(propertyId, scenes.map((scene) => scene.id));
}

export async function createSceneAction(formData: FormData): Promise<AdminActionResult> {
  try {
    await requireAdmin();
    const propertyId = String(formData.get("propertyId") || "");
    const mediaId = String(formData.get("mediaId") || "");
    const name = String(formData.get(`name_${mediaId}`) || "").trim();
    if (!propertyId || !mediaId || !name) return actionError("Data ruangan belum lengkap.");

    const existingScenes = await getOrderedScenes(propertyId);
    const { error } = await getSupabase().from("scenes").insert({
      id: crypto.randomUUID(), property_id: propertyId, media_id: mediaId, name,
      sort_order: existingScenes.length, is_first_scene: existingScenes.length === 0,
    });
    if (error) throw error;
    revalidatePath(tourPath(propertyId));
    return actionSuccess("Ruangan berhasil ditambahkan ke tur 360°.");
  } catch (error) {
    console.error("createSceneAction:", error);
    return actionError(adminActionErrorMessage(error));
  }
}

export async function moveSceneAction(formData: FormData): Promise<AdminActionResult> {
  try {
    await requireAdmin();
    const propertyId = String(formData.get("propertyId") || "");
    const sceneId = String(formData.get("sceneId") || "");
    const direction = String(formData.get("direction") || "") === "up" ? -1 : 1;
    if (!propertyId || !sceneId) return actionError("Ruangan tidak valid.");

    const scenes = await getOrderedScenes(propertyId);
    const ids = scenes.map((scene) => scene.id);
    const index = ids.indexOf(sceneId);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= ids.length) return actionError("Ruangan sudah berada di posisi paling ujung.");
    [ids[index], ids[targetIndex]] = [ids[targetIndex], ids[index]];
    await persistOrder(propertyId, ids);

    revalidatePath(tourPath(propertyId));
    return actionSuccess("Urutan ruangan berhasil diperbarui. Nomor 1 otomatis menjadi tampilan pertama.");
  } catch (error) {
    console.error("moveSceneAction:", error);
    return actionError(adminActionErrorMessage(error));
  }
}

export async function createHotspotAction(formData: FormData): Promise<AdminActionResult> {
  try {
    await requireAdmin();
    const sceneId = String(formData.get("sceneId") || "");
    const targetSceneId = String(formData.get("targetSceneId") || "");
    const propertyId = String(formData.get("propertyId") || "");
    const rawLabel = String(formData.get("label") || "").trim().slice(0, 180);
    const iconType = String(formData.get("iconType") || "door");
    const label = `${rawLabel}|||${["door", "arrow", "thumbnail"].includes(iconType) ? iconType : "door"}`;
    const pitch = Number(formData.get("pitch"));
    const yaw = Number(formData.get("yaw"));
    if (!sceneId || !targetSceneId || !propertyId || !rawLabel || !Number.isFinite(pitch) || !Number.isFinite(yaw)) return actionError("Koordinat, label, atau tujuan hotspot tidak valid.");

    const { error } = await getSupabase().from("hotspots").insert({ id: crypto.randomUUID(), scene_id: sceneId, target_scene_id: targetSceneId, pitch, yaw, label });
    if (error) throw error;
    revalidatePath(tourPath(propertyId));
    return actionSuccess("Hotspot berhasil disimpan.");
  } catch (error) {
    console.error("createHotspotAction:", error);
    return actionError(adminActionErrorMessage(error));
  }
}

export async function deleteHotspotAction(formData: FormData): Promise<AdminActionResult> {
  try {
    await requireAdmin();
    const hotspotId = String(formData.get("hotspotId") || "");
    const propertyId = String(formData.get("propertyId") || "");
    const { error } = await getSupabase().from("hotspots").delete().eq("id", hotspotId);
    if (error) throw error;
    revalidatePath(tourPath(propertyId));
    return actionSuccess("Hotspot berhasil dihapus.");
  } catch (error) {
    return actionError(adminActionErrorMessage(error));
  }
}

export async function deleteSceneAction(formData: FormData): Promise<AdminActionResult> {
  try {
    await requireAdmin();
    const sceneId = String(formData.get("sceneId") || "");
    const propertyId = String(formData.get("propertyId") || "");
    const supabase = getSupabase();
    const { error: h1 } = await supabase.from("hotspots").delete().eq("scene_id", sceneId);
    const { error: h2 } = await supabase.from("hotspots").delete().eq("target_scene_id", sceneId);
    if (h1 || h2) throw h1 || h2;
    const { error } = await supabase.from("scenes").delete().eq("id", sceneId);
    if (error) throw error;
    await normalizeSceneOrder(propertyId);
    revalidatePath(tourPath(propertyId));
    return actionSuccess("Ruangan berhasil dihapus dari tur.");
  } catch (error) {
    return actionError(adminActionErrorMessage(error));
  }
}

export async function setFirstSceneAction(formData: FormData): Promise<AdminActionResult> {
  try {
    await requireAdmin();
    const sceneId = String(formData.get("sceneId") || "");
    const propertyId = String(formData.get("propertyId") || "");
    const scenes = await getOrderedScenes(propertyId);
    const ids = scenes.map((scene) => scene.id).filter((id) => id !== sceneId);
    if (!scenes.some((scene) => scene.id === sceneId)) return actionError("Ruangan tidak ditemukan.");
    ids.unshift(sceneId);
    await persistOrder(propertyId, ids);
    revalidatePath(tourPath(propertyId));
    return actionSuccess("Ruangan dipindahkan ke urutan nomor 1 dan menjadi tampilan pertama.");
  } catch (error) {
    return actionError(adminActionErrorMessage(error));
  }
}

export async function updateSceneNameAction(formData: FormData): Promise<AdminActionResult> {
  try {
    await requireAdmin();
    const sceneId = String(formData.get("sceneId") || "");
    const propertyId = String(formData.get("propertyId") || "");
    const name = String(formData.get("name") || "").trim().slice(0, 255);
    if (!name) return actionError("Nama ruangan tidak boleh kosong.");
    const { error } = await getSupabase().from("scenes").update({ name }).eq("id", sceneId);
    if (error) throw error;
    revalidatePath(tourPath(propertyId));
    return actionSuccess("Nama ruangan berhasil diperbarui.");
  } catch (error) {
    return actionError(adminActionErrorMessage(error));
  }
}

export async function updateSceneAudioAction(formData: FormData): Promise<AdminActionResult> {
  try {
    await requireAdmin();
    const sceneId = String(formData.get("sceneId") || "");
    const propertyId = String(formData.get("propertyId") || "");
    const audioMediaId = String(formData.get("audioMediaId") || "none");
    const { error } = await getSupabase().from("scenes").update({ audio_media_id: audioMediaId === "none" ? null : audioMediaId }).eq("id", sceneId);
    if (error) throw error;
    revalidatePath(tourPath(propertyId));
    return actionSuccess("Audio ruangan berhasil diperbarui.");
  } catch (error) {
    return actionError(adminActionErrorMessage(error));
  }
}

export async function setInitialViewAction(formData: FormData): Promise<AdminActionResult> {
  try {
    await requireAdmin();
    const sceneId = String(formData.get("sceneId") || "");
    const propertyId = String(formData.get("propertyId") || "");
    const pitch = Number(formData.get("pitch") || formData.get("initialPitch") || 0);
    const yaw = Number(formData.get("yaw") || formData.get("initialYaw") || 0);
    if (!Number.isFinite(pitch) || !Number.isFinite(yaw)) return actionError("Koordinat pandangan awal tidak valid.");
    const { error } = await getSupabase().from("scenes").update({ initial_pitch: pitch, initial_yaw: yaw }).eq("id", sceneId);
    if (error) throw error;
    revalidatePath(tourPath(propertyId));
    return actionSuccess("Pandangan awal berhasil disimpan.");
  } catch (error) {
    return actionError(adminActionErrorMessage(error));
  }
}
