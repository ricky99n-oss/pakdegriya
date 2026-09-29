import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "edge";

type HotspotPayload = {
  propertyId?: unknown;
  sceneId?: unknown;
  targetSceneId?: unknown;
  pitch?: unknown;
  yaw?: unknown;
  label?: unknown;
  iconType?: unknown;
};

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function safeUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const origin = request.headers.get("origin");
    if (origin && new URL(origin).origin !== new URL(request.url).origin) {
      return json({ success: false, error: "Origin request tidak valid." }, 403);
    }

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return json({ success: false, error: "Format request tidak valid." }, 415);
    }

    const body = (await request.json()) as HotspotPayload;

    const propertyId = String(body.propertyId || "");
    const sceneId = String(body.sceneId || "");
    const targetSceneId = String(body.targetSceneId || "");
    const rawLabel = String(body.label || "").trim().slice(0, 180);
    const iconType = String(body.iconType || "door");
    const pitch = Number(body.pitch);
    const yaw = Number(body.yaw);

    if (
      !safeUuid(propertyId) ||
      !safeUuid(sceneId) ||
      !safeUuid(targetSceneId) ||
      sceneId === targetSceneId ||
      !rawLabel ||
      !Number.isFinite(pitch) ||
      !Number.isFinite(yaw)
    ) {
      return json({ success: false, error: "Koordinat, label, atau tujuan hotspot tidak valid." }, 400);
    }

    const normalizedIconType = ["door", "arrow", "thumbnail"].includes(iconType)
      ? iconType
      : "door";
    const label = `${rawLabel}|||${normalizedIconType}`;

    const supabase = getSupabaseAdmin();

    const { data: scenes, error: sceneError } = await supabase
      .from("scenes")
      .select("id, property_id")
      .in("id", [sceneId, targetSceneId])
      .eq("property_id", propertyId);

    if (sceneError) throw sceneError;

    if (!scenes || scenes.length !== 2) {
      return json({ success: false, error: "Ruangan hotspot tidak valid untuk properti ini." }, 400);
    }

    const { data: existing, error: duplicateError } = await supabase
      .from("hotspots")
      .select("id")
      .eq("scene_id", sceneId)
      .eq("target_scene_id", targetSceneId)
      .eq("pitch", pitch)
      .eq("yaw", yaw)
      .limit(1);

    if (duplicateError) throw duplicateError;

    if (existing?.length) {
      return json({ success: false, error: "Hotspot dengan koordinat dan tujuan yang sama sudah ada." }, 409);
    }

    const { error: insertError } = await supabase.from("hotspots").insert({
      id: crypto.randomUUID(),
      scene_id: sceneId,
      target_scene_id: targetSceneId,
      pitch,
      yaw,
      label,
    });

    if (insertError) throw insertError;

    return json({ success: true, message: "Hotspot berhasil disimpan." });
  } catch (error) {
    console.error("createHotspot API gagal:", {
      message: error instanceof Error ? error.message : String(error),
    });

    const unauthorized = error instanceof Error && error.message === "UNAUTHORIZED";
    return json(
      {
        success: false,
        error: unauthorized
          ? "Sesi admin tidak valid. Silakan login kembali."
          : error instanceof Error && error.message
            ? error.message
            : "Hotspot gagal disimpan. Silakan coba lagi.",
      },
      unauthorized ? 401 : 500
    );
  }
}
