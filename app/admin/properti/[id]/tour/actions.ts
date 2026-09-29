"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireAdmin, adminActionErrorMessage } from "@/lib/admin-auth";
import { actionError, actionSuccess, type AdminActionResult } from "@/lib/admin-action";
import { isTourId, readTourCoordinates } from "@/lib/tour-input";

function tourPath(propertyId: string) {
  return `/admin/properti/${propertyId}/tour`;
}

async function scenesBelongToProperty(propertyId: string, sceneIds: string[]) {
  const { data, error } = await getSupabaseAdmin()
    .from("scenes")
    .select("id")
    .eq("property_id", propertyId)
    .in("id", sceneIds);
  if (error) throw error;
  return sceneIds.every((id) => data?.some((scene) => scene.id === id));
}

function tourErrorMessage(error: unknown) {
  // PostgREST errors are plain objects, not Error instances.
  if (error && typeof error === "object" && "code" in error) {
    switch (error.code) {
      case "23503": return "Ruangan sudah berubah atau dihapus. Muat ulang halaman lalu pilih kembali.";
      case "42501": return "Database menolak perubahan tur. Periksa izin akses database pada server.";
      case "42703":
      case "PGRST204": return "Struktur database tur belum sesuai. Periksa migration Supabase.";
    }
  }
  return adminActionErrorMessage(error);
}

async function getOrderedScenes(propertyId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("scenes")
    .select("id, sort_order, created_at")
    .eq("property_id", propertyId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

async function persistOrder(propertyId: string, orderedIds: string[]) {
  const supabase = getSupabaseAdmin();
  const reset = await supabase.from("scenes").update({ is_first_scene: false }).eq("property_id", propertyId);
  if (reset.error) throw reset.error;

  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from("scenes")
        .update({ sort_order: index, is_first_scene: index === 0 })
        .eq("id", id)
        .eq("property_id", propertyId)
    )
  );

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

    const supabase = getSupabaseAdmin();
    const { data: media, error: mediaError } = await supabase
      .from("property_media")
      .select("id, property_id, file_type")
      .eq("id", mediaId)
      .eq("property_id", propertyId)
      .maybeSingle();
    if (mediaError) throw mediaError;
    if (!media || media.file_type !== "panorama_private") {
      return actionError("Panorama tidak valid atau tidak lagi tersedia.");
    }

    const existingScenes = await getOrderedScenes(propertyId);
    const { error } = await supabase.from("scenes").insert({
      id: crypto.randomUUID(),
      property_id: propertyId,
      media_id: mediaId,
      name,
      sort_order: existingScenes.length,
      is_first_scene: existingScenes.length === 0,
    });
    if (error) throw error;
    revalidatePath(tourPath(propertyId));
    return actionSuccess("Ruangan berhasil ditambahkan ke tur 360°.");
  } catch (error) {
    console.error("createSceneAction:", error);
    return actionError(adminActionErrorMessage(error));
  }
}

export async function reorderScenesAction(formData: FormData): Promise<AdminActionResult> {
  try {
    await requireAdmin();
    const propertyId = String(formData.get("propertyId") || "");
    const raw = String(formData.get("orderedIds") || "");
    if (!propertyId || !raw) return actionError("Urutan ruangan tidak valid.");

    let orderedIds: string[] = [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) orderedIds = parsed.map((item) => String(item));
    } catch {
      return actionError("Format urutan ruangan tidak valid.");
    }

    if (!orderedIds.length || new Set(orderedIds).size !== orderedIds.length) {
      return actionError("Urutan ruangan berisi data duplikat atau kosong.");
    }

    const scenes = await getOrderedScenes(propertyId);
    const currentIds = scenes.map((scene) => scene.id);
    if (
      currentIds.length !== orderedIds.length ||
      currentIds.some((id) => !orderedIds.includes(id))
    ) {
      return actionError("Daftar ruangan berubah. Muat ulang halaman lalu coba lagi.");
    }

    await persistOrder(propertyId, orderedIds);
    revalidatePath(tourPath(propertyId));
    return actionSuccess("Urutan ruangan berhasil disimpan. Urutan pertama menjadi tampilan awal user.");
  } catch (error) {
    console.error("reorderScenesAction:", error);
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
    if (index < 0 || targetIndex < 0 || targetIndex >= ids.length) {
      return actionError("Ruangan sudah berada di posisi paling ujung.");
    }
    [ids[index], ids[targetIndex]] = [ids[targetIndex], ids[index]];
    await persistOrder(propertyId, ids);

    revalidatePath(tourPath(propertyId));
    return actionSuccess("Urutan ruangan berhasil diperbarui.");
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
    const coordinates = readTourCoordinates(formData);
    if (!isTourId(sceneId) || !isTourId(targetSceneId) || !isTourId(propertyId) || !rawLabel || !coordinates) {
      return actionError("Koordinat, label, atau tujuan hotspot tidak valid.");
    }
    if (sceneId === targetSceneId || !await scenesBelongToProperty(propertyId, [sceneId, targetSceneId])) {
      return actionError("Ruangan asal dan tujuan harus berbeda dan berada pada properti yang sama.");
    }

    const { error } = await getSupabaseAdmin().from("hotspots").insert({
      id: crypto.randomUUID(),
      scene_id: sceneId,
      target_scene_id: targetSceneId,
      ...coordinates,
      label,
    });
    if (error) throw error;
    revalidatePath(tourPath(propertyId));
    return actionSuccess("Hotspot berhasil disimpan.");
  } catch (error) {
    console.error("createHotspotAction:", error);
    return actionError(tourErrorMessage(error));
  }
}

export async function deleteHotspotAction(formData: FormData): Promise<AdminActionResult> {
  try {
    await requireAdmin();
    const hotspotId = String(formData.get("hotspotId") || "");
    const propertyId = String(formData.get("propertyId") || "");
    if (!isTourId(hotspotId) || !isTourId(propertyId)) return actionError("Hotspot tidak valid.");
    const supabase = getSupabaseAdmin();
    const { data: hotspot, error: lookupError } = await supabase.from("hotspots").select("scene_id").eq("id", hotspotId).maybeSingle();
    if (lookupError) throw lookupError;
    if (!hotspot || !await scenesBelongToProperty(propertyId, [hotspot.scene_id])) {
      return actionError("Hotspot tidak ditemukan pada properti ini. Muat ulang halaman.");
    }
    const { data, error } = await supabase.from("hotspots").delete().eq("id", hotspotId).eq("scene_id", hotspot.scene_id).select("id");
    if (error) throw error;
    if (!data?.length) return actionError("Hotspot sudah dihapus. Muat ulang halaman.");
    revalidatePath(tourPath(propertyId));
    return actionSuccess("Hotspot berhasil dihapus.");
  } catch (error) {
    console.error("deleteHotspotAction:", error);
    return actionError(tourErrorMessage(error));
  }
}

export async function deleteSceneAction(formData: FormData): Promise<AdminActionResult> {
  try {
    await requireAdmin();
    const sceneId = String(formData.get("sceneId") || "");
    const propertyId = String(formData.get("propertyId") || "");
    const supabase = getSupabaseAdmin();
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
    const { error } = await getSupabaseAdmin().from("scenes").update({ name }).eq("id", sceneId);
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
    const audioMediaId = String(formData.get("audioMediaId") || "auto");
    if (!isTourId(sceneId) || !isTourId(propertyId)) return actionError("Data ruangan tidak valid.");
    if (!(await scenesBelongToProperty(propertyId, [sceneId]))) return actionError("Ruangan tidak ditemukan pada properti ini.");
    const admin = getSupabaseAdmin();
    if (audioMediaId !== "auto" && audioMediaId !== "none") {
      if (!isTourId(audioMediaId)) return actionError("Audio tidak valid.");
      const { data, error } = await admin.from("property_media").select("id").eq("id", audioMediaId).eq("property_id", propertyId).eq("file_type", "audio_private").maybeSingle();
      if (error) throw error;
      if (!data) return actionError("Audio tidak ditemukan pada properti ini.");
    }
    const { data, error } = await admin.from("scenes")
      .update({ audio_media_id: audioMediaId === "auto" ? null : audioMediaId })
      .eq("id", sceneId).eq("property_id", propertyId).select("id");
    if (error) throw error;
    if (!data?.length) return actionError("Ruangan tidak ditemukan.");
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
    const coordinates = readTourCoordinates(formData);
    if (!isTourId(sceneId) || !isTourId(propertyId) || !coordinates) {
      return actionError("Koordinat pandangan awal tidak valid.");
    }
    const { data, error } = await getSupabaseAdmin()
      .from("scenes")
      .update({ initial_pitch: coordinates.pitch, initial_yaw: coordinates.yaw })
      .eq("id", sceneId)
      .eq("property_id", propertyId)
      .select("id");
    if (error) throw error;
    if (!data?.length) return actionError("Ruangan tidak ditemukan pada properti ini. Muat ulang halaman.");
    revalidatePath(tourPath(propertyId));
    return actionSuccess("Pandangan awal berhasil disimpan.");
  } catch (error) {
    console.error("setInitialViewAction:", error);
    return actionError(tourErrorMessage(error));
  }
}
