import {
  createHotspotAction,
  deleteHotspotAction,
  setInitialViewAction,
} from "@/app/admin/properti/[id]/tour/actions";
import { actionError, type AdminActionResult } from "@/lib/admin-action";

export const runtime = "edge";

function json(result: AdminActionResult, status = 200) {
  return Response.json(result, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  // Route Handlers do not get the Server Action origin check automatically.
  // Next's Edge adapter may reconstruct request.url with an internal hostname.
  // Compare against the actual request Host, as Server Actions do.
  const host = request.headers.get("host") || new URL(request.url).host;
  let originHost = "";
  try {
    const origin = new URL(request.headers.get("origin") || "");
    if (origin.protocol === "https:" || origin.protocol === "http:") originHost = origin.host;
  } catch {}
  if (!originHost || originHost !== host) {
    return json(actionError("Origin request tidak valid."), 403);
  }
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    return json(actionError("Request harus berupa JSON."), 415);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json(actionError("Format request tidak valid."), 400);
  }
  if (!body || typeof body !== "object" || !body.fields || typeof body.fields !== "object" || Array.isArray(body.fields)) {
    return json(actionError("Data tur tidak valid."), 400);
  }

  const formData = new FormData();
  for (const [name, value] of Object.entries(body.fields)) {
    if (typeof value !== "string") return json(actionError("Data tur harus berupa teks."), 400);
    formData.set(name, value);
  }

  try {
    // Call the authenticated mutations on the server; no Next-Action header or
    // RSC response is required. Each action checks requireAdmin before any write.
    let result: AdminActionResult;
    switch (body.operation) {
      case "createHotspot": result = await createHotspotAction(formData); break;
      case "deleteHotspot": result = await deleteHotspotAction(formData); break;
      case "setInitialView": result = await setInitialViewAction(formData); break;
      default: return json(actionError("Operasi tur tidak dikenal."), 400);
    }
    return json(result, result.success ? 200 : 400);
  } catch (error) {
    console.error("Tour API failed:", error);
    return json(actionError("Perubahan tur gagal diproses. Muat ulang halaman sebelum mencoba lagi."), 500);
  }
}
