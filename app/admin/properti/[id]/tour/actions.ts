"use server";

import { db } from "@/db";
import { scenes, hotspots } from "@/db/schema";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { eq } from "drizzle-orm";

export async function createSceneAction(formData: FormData) {
  const propertyId = formData.get("propertyId") as string;
  const mediaId = formData.get("mediaId") as string;
  const name = formData.get("name") as string;

  await db.insert(scenes).values({
    id: crypto.randomUUID(),
    propertyId,
    mediaId,
    name,
  });

  revalidatePath(`/admin/properti/${propertyId}/tour`);
}

export async function createHotspotAction(formData: FormData) {
  const propertyId = formData.get("propertyId") as string;
  const sceneId = formData.get("sceneId") as string;
  const targetSceneId = formData.get("targetSceneId") as string;
  const pitch = Number(formData.get("pitch"));
  const yaw = Number(formData.get("yaw"));
  const label = formData.get("label") as string;

  await db.insert(hotspots).values({
    id: crypto.randomUUID(),
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
  revalidatePath(`/admin/properti/${propertyId}/tour`);
}

export async function deleteHotspotAction(formData: FormData) {
  const hotspotId = formData.get("hotspotId") as string;
  const propertyId = formData.get("propertyId") as string;
  
  await db.delete(hotspots).where(eq(hotspots.id, hotspotId));
  revalidatePath(`/admin/properti/${propertyId}/tour`);
}

export async function updateSceneNameAction(formData: FormData) {
  const sceneId = formData.get("sceneId") as string;
  const propertyId = formData.get("propertyId") as string;
  const newName = formData.get("name") as string;

  await db.update(scenes)
    .set({ name: newName })
    .where(eq(scenes.id, sceneId));

  revalidatePath(`/admin/properti/${propertyId}/tour`);
}

export async function updateSceneAudioAction(formData: FormData) {
  const sceneId = formData.get("sceneId") as string;
  const propertyId = formData.get("propertyId") as string;
  const audioMediaId = formData.get("audioMediaId") as string;
  const autoRotateSpeed = Number(formData.get("autoRotateSpeed"));

  await db.update(scenes)
    .set({ 
      audioMediaId: audioMediaId === "" ? null : audioMediaId,
      autoRotateSpeed: autoRotateSpeed
    })
    .where(eq(scenes.id, sceneId));

  revalidatePath(`/admin/properti/${propertyId}/tour`);
}

export async function setFirstSceneAction(formData: FormData) {
  const sceneId = formData.get("sceneId") as string;
  const propertyId = formData.get("propertyId") as string;

  await db.update(scenes).set({ isFirstScene: false }).where(eq(scenes.propertyId, propertyId));
  await db.update(scenes).set({ isFirstScene: true }).where(eq(scenes.id, sceneId));

  revalidatePath(`/admin/properti/${propertyId}/tour`);
}

export async function setInitialViewAction(formData: FormData) {
  const sceneId = formData.get("sceneId") as string;
  const propertyId = formData.get("propertyId") as string;
  const pitch = Number(formData.get("pitch"));
  const yaw = Number(formData.get("yaw"));

  await db.update(scenes)
    .set({ initialPitch: pitch, initialYaw: yaw })
    .where(eq(scenes.id, sceneId));

  revalidatePath(`/admin/properti/${propertyId}/tour`);
}