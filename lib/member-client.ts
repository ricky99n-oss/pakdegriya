import type { Member, MemberPage } from "./members";
export async function loadMemberPage(q: string, role: string, page: number, pageSize = 50, signal?: AbortSignal): Promise<MemberPage> {
  const params = new URLSearchParams({ q, role, page: String(page), pageSize: String(pageSize) });
  const response = await fetch(`/api/admin/members?${params}`, { credentials: "same-origin", cache: "no-store", signal });
  const result = await response.json().catch(() => null);
  if (!response.ok || !Array.isArray(result?.members)) throw new Error(result?.error || `Gagal memuat member (HTTP ${response.status}).`);
  return result;
}
export async function loadAllMembers(q: string, role: string): Promise<Member[]> {
  const members: Member[] = [];
  const seen = new Set<string>();
  let total: number | undefined;
  for (let page = 1; ; page++) {
    const result = await loadMemberPage(q, role, page, 200);
    if (total !== undefined && total !== result.total) throw new Error("Daftar berubah saat ekspor. Silakan ekspor ulang.");
    total = result.total;
    for (const member of result.members) {
      if (seen.has(member.id)) throw new Error("Daftar berubah saat ekspor. Silakan ekspor ulang.");
      seen.add(member.id); members.push(member);
    }
    if (members.length >= total) return members;
    if (!result.members.length) throw new Error("Data ekspor belum lengkap. Silakan coba lagi.");
  }
}
