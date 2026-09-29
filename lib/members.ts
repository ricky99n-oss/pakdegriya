export type Member = { id: string; name: string | null; email: string; phone: string | null; role: string; created_at: string | null };
export type MemberPage = { members: Member[]; total: number; page: number; pageSize: number };
export function normalizeMemberPhone(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;
  else if (digits.startsWith("8")) digits = `62${digits}`;
  return /^62\d{8,13}$/.test(digits) ? `+${digits}` : null;
}
export function memberExportRows(members: Member[]) {
  return members.map((member, index) => [String(index + 1), member.name || "", member.email, member.phone || "", member.role, member.created_at ? new Date(member.created_at).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" }) : ""]);
}
export const MEMBER_HEADERS = ["No", "Nama / Username", "Email", "WhatsApp", "Peran", "Tanggal Daftar"];
