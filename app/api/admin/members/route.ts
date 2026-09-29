import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { normalizeMemberPhone } from "@/lib/members";

export const runtime = "edge";
const columns = "id,name,email,phone,role,created_at";
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "private, no-store", Vary: "Cookie" } });
function failure(error: unknown) {
  const unauthorized = error instanceof Error && error.message === "UNAUTHORIZED";
  if (!unauthorized) console.error("Members API:", error);
  return json({ success: false, error: unauthorized ? "Sesi admin berakhir. Silakan masuk kembali." : "Data member gagal diproses. Silakan coba lagi." }, unauthorized ? 401 : 500);
}
export async function GET(request: Request) {
  try {
    await requireAdmin();
    const params = new URL(request.url).searchParams;
    const page = Number(params.get("page") || 1);
    const pageSize = Number(params.get("pageSize") || 50);
    if (!Number.isSafeInteger(page) || page < 1 || page > 100000 || !Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 200) return json({ error: "Halaman tidak valid." }, 400);
    const role = params.get("role") || "";
    if (role && !["member", "admin", "superadmin"].includes(role)) return json({ error: "Peran tidak valid." }, 400);
    // PostgREST filter delimiters/wildcards cannot be supplied by the search input.
    const q = (params.get("q") || "").slice(0, 120).replace(/[^\p{L}\p{N}@+ ._-]/gu, "").replace(/_/g, " ").trim();
    let query = getSupabaseAdmin().from("users").select(columns, { count: "exact" });
    if (q) query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
    if (role) query = query.eq("role", role);
    const { data, count, error } = await query.order("created_at", { ascending: false }).order("id", { ascending: true }).range((page - 1) * pageSize, page * pageSize - 1);
    if (error) throw error;
    return json({ members: data || [], total: count || 0, page, pageSize });
  } catch (error) { return failure(error); }
}
export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const host = request.headers.get("host") || new URL(request.url).host;
    let origin: URL;
    try { origin = new URL(request.headers.get("origin") || ""); } catch { return json({ error: "Origin tidak valid." }, 403); }
    if (!["https:", "http:"].includes(origin.protocol) || origin.host !== host) return json({ error: "Origin tidak valid." }, 403);
    if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return json({ error: "Request harus JSON." }, 415);
    const body = await request.json().catch(() => null);
    if (!body || typeof body.id !== "string" || !body.id || body.id.length > 255 || typeof body.name !== "string" || typeof body.phone !== "string") return json({ error: "Data member tidak valid." }, 400);
    const name = body.name.trim();
    const phone = normalizeMemberPhone(body.phone);
    if (!name || name.length > 120 || !phone) return json({ error: "Isi nama maksimal 120 karakter dan nomor WhatsApp Indonesia yang valid." }, 400);
    // Deliberately whitelist profile fields; role, email, and credentials cannot be changed here.
    const { data, error } = await getSupabaseAdmin().from("users").update({ name, phone }).eq("id", body.id).select(columns).maybeSingle();
    if (error) throw error;
    if (!data) return json({ error: "Member tidak ditemukan." }, 404);
    return json({ success: true, member: data, message: "Profil member berhasil diperbarui." });
  } catch (error) { return failure(error); }
}
