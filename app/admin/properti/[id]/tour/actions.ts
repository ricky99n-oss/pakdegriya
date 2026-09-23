"use server";
import { db } from "@/db";
import { scenes, hotspots, propertyMedia } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createSceneAction(formData: FormData) {
  const propertyId = formData.get("propertyId") as string;
  const mediaId = formData.get("mediaId") as string;
  const name = formData.get(`name_${mediaId}`) as string;

  if (!name || name.trim() === "") return;

  // Cek apakah ini scene pertama untuk properti ini
  const existingScenes = await db.select().from(scenes).where(eq(scenes.propertyId, propertyId));
  const isFirst = existingScenes.length === 0;

  await db.insert(scenes).values({
    id: globalThis.crypto.randomUUID(),
    propertyId,
    mediaId,
    name: name.trim(),
    isFirstScene: isFirst,
  });

  // Revalidate path yang TEPAT agar halaman merefresh datanya tanpa error 500
  revalidatePath(`/admin/properti/${propertyId}/tour`);
}

export async function saveHotspotAction(formData: FormData) {
  const sceneId = formData.get("sceneId") as string;
  const targetSceneId = formData.get("targetSceneId") as string;
  const pitch = Number(formData.get("pitch"));
  const yaw = Number(formData.get("yaw"));
  const label = formData.get("label") as string;
  const propertyId = formData.get("propertyId") as string;

  await db.insert(hotspots).values({
    id: globalThis.crypto.randomUUID(),
    sceneId,
    targetSceneId,
    pitch,
    yaw,
    label,
  });

  revalidatePath(`/admin/properti/${propertyId}/tour`);
}

export async function deleteSceneAction(formData: FormData) {
  const sceneId = formData.get("sceneId") as string;
  const propertyId = formData.get("propertyId") as string;

  await db.delete(scenes).where(eq(scenes.id, sceneId));
  
  // Hapus hotspot yang terhubung
  await db.delete(hotspots).where(eq(hotspots.sceneId, sceneId));
  await db.delete(hotspots).where(eq(hotspots.targetSceneId, sceneId));

  revalidatePath(`/admin/properti/${propertyId}/tour`);
}

export async function deleteHotspotAction(formData: FormData) {
  const hotspotId = formData.get("hotspotId") as string;
  const propertyId = formData.get("propertyId") as string;

  await db.delete(hotspots).where(eq(hotspots.id, hotspotId));

  revalidatePath(`/admin/properti/${propertyId}/tour`);
}

export async function setFirstSceneAction(formData: FormData) {
  const sceneId = formData.get("sceneId") as string;
  const propertyId = formData.get("propertyId") as string;

  // Reset semua scene menjadi false
  await db.update(scenes)
    .set({ isFirstScene: false })
    .where(eq(scenes.propertyId, propertyId));

  // Set scene yang dipilih menjadi true
  await db.update(scenes)
    .set({ isFirstScene: true })
    .where(eq(scenes.id, sceneId));

  revalidatePath(`/admin/properti/${propertyId}/tour`);
}

export async function saveTourSettingsAction(formData: FormData) {
  const sceneId = formData.get("sceneId") as string;
  const propertyId = formData.get("propertyId") as string;
  const initialPitch = Number(formData.get("initialPitch"));
  const initialYaw = Number(formData.get("initialYaw"));
  const autoRotateSpeed = Number(formData.get("autoRotateSpeed"));
  const audioMediaId = formData.get("audioMediaId") as string;

  await db.update(scenes).set({
    initialPitch,
    initialYaw,
    autoRotateSpeed,
    audioMediaId: audioMediaId === "none" ? null : audioMediaId,
  }).where(eq(scenes.id, sceneId));

  revalidatePath(`/admin/properti/${propertyId}/tour`);
}