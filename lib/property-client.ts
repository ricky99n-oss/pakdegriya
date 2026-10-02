import type { AdminActionResult } from "./admin-action";

export async function updateProperty(formData: FormData): Promise<AdminActionResult> {
  return propertyRequest("updateProperty", formData);
}

export async function setPublishStatus(formData: FormData): Promise<AdminActionResult> {
  return propertyRequest("setPublishStatus", formData);
}

async function propertyRequest(operation: "updateProperty" | "setPublishStatus", formData: FormData): Promise<AdminActionResult> {
  try {
    // Use a stable JSON endpoint instead of the page's Server Action / RSC transport.
    const response = await fetch("/api/admin/properties", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ operation, fields: Object.fromEntries(formData.entries()) }),
    });
    const payload: unknown = response.headers.get("content-type")?.includes("application/json")
      ? await response.json().catch(() => null)
      : null;

    if (payload && typeof payload === "object" && "success" in payload && typeof payload.success === "boolean") {
      const result = payload as AdminActionResult;
      if (response.ok || !result.success) return result;
    }

    return {
      success: false,
      error: `Server tidak mengirim respons yang valid (HTTP ${response.status}). Muat ulang halaman untuk memeriksa hasil sebelum mencoba lagi.`,
    };
  } catch {
    // Never retry a write automatically: the server may already have saved it.
    return {
      success: false,
      error: "Koneksi terputus saat menyimpan. Muat ulang halaman untuk memeriksa hasil sebelum mencoba lagi.",
    };
  }
}
