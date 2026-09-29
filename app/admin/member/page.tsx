import { requireAdmin } from "@/lib/admin-auth";
import MemberManager from "@/components/admin/MemberManager";
export const dynamic = "force-dynamic";
export default async function MembersPage() {
  await requireAdmin();
  return <div className="space-y-6"><div><h1 className="text-3xl font-black text-[#4A2F1B]">Kelola Member</h1><p className="mt-2 text-sm text-[#4A2F1B]/70">Data akun terdaftar, kontak WhatsApp, dan ekspor daftar member.</p></div><MemberManager /></div>;
}
