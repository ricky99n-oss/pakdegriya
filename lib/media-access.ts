// Keep the high-frequency media route independent of supabase-js, profile
// queries and the admin auth graph. Only Web APIs are needed here.
export type MediaRecord = {
  file_name: string;
  preview_file_name: string | null;
  mime_type: string | null;
  is_public: boolean;
};

export type MediaAccessConfig = { url: string; anonKey: string };

const MEDIA_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getMediaRecord(id: string, config: MediaAccessConfig): Promise<MediaRecord | null> {
  if (!MEDIA_ID.test(id)) return null;
  const url = new URL("rest/v1/property_media", `${config.url.replace(/\/$/, "")}/`);
  url.searchParams.set("select", "file_name,preview_file_name,mime_type,is_public");
  url.searchParams.set("id", `eq.${id}`);
  url.searchParams.set("limit", "1");

  const response = await fetch(url, {
    headers: { apikey: config.anonKey, Authorization: `Bearer ${config.anonKey}`, Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Media metadata request failed (${response.status}).`);
  const rows: unknown = await response.json();
  if (!Array.isArray(rows)) throw new Error("Invalid media metadata response.");
  const media = rows[0];
  if (!media) return null;
  if (typeof media.file_name !== "string" || !media.file_name) throw new Error("Invalid media file name.");
  return {
    file_name: media.file_name,
    preview_file_name: typeof media.preview_file_name === "string" ? media.preview_file_name : null,
    mime_type: typeof media.mime_type === "string" ? media.mime_type : null,
    is_public: media.is_public === true,
  };
}

export async function hasMediaSession(request: Request, config: MediaAccessConfig): Promise<boolean> {
  const cookie = (request.headers.get("cookie") || "").split(";").map((value) => value.trim())
    .find((value) => value.startsWith("supabase_access_token="));
  if (!cookie) return false;
  let token: string;
  try { token = decodeURIComponent(cookie.slice("supabase_access_token=".length)); } catch { return false; }
  if (!token) return false;

  // Verify on Supabase Auth for every private request. Do not trust a cookie's
  // presence or cache authorization across users / after session revocation.
  const response = await fetch(`${config.url.replace(/\/$/, "")}/auth/v1/user`, {
    headers: { apikey: config.anonKey, Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
  });
  if (response.status === 401 || response.status === 403) return false;
  if (!response.ok) throw new Error(`Media session verification failed (${response.status}).`);
  const payload = await response.json();
  const user = payload?.user ?? payload;
  return typeof user?.id === "string" && user.id.length > 0;
}
