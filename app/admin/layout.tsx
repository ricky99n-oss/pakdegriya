import { NO_INDEX } from "@/lib/seo";
export const metadata = NO_INDEX;
import AdminNavigation from "@/components/admin/AdminNavigation";
import { validateRequest } from "../../lib/auth";
import { redirect } from "next/navigation";
import { UserCircle } from "lucide-react";
import LogoutButton from "@/components/admin/LogoutButton";

export const runtime = "edge";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await validateRequest();

  if (!user || (user.role !== "superadmin" && user.role !== "admin")) {
    redirect("/auth/masuk");
  }

  return (
    <div className="min-h-screen bg-[#FFF7E8] md:flex">
      <aside className="hidden md:flex sticky top-0 h-screen w-60 lg:w-64 shrink-0 bg-[#4A2F1B] text-white flex-col shadow-2xl z-20 overflow-y-auto">
        <div className="px-5 py-5 flex items-center gap-3 border-b border-white/10">
          <div className="w-10 h-10 rounded-xl bg-[#D6A34A] flex items-center justify-center text-[#4A2F1B] font-bold text-xl shadow-lg shrink-0">P</div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold tracking-wide text-white truncate">Pakde Griya</h2>
            <p className="text-[10px] text-[#D6A34A] tracking-wider uppercase">Admin Panel</p>
          </div>
        </div>

        <AdminNavigation />

        <div className="p-4 mt-auto">
          <div className="p-3 rounded-2xl bg-black/20 backdrop-blur-sm border border-white/10">
            <div className="flex items-center gap-3">
              <UserCircle size={32} className="text-[#D6A34A] shrink-0" />
              <div className="overflow-hidden min-w-0">
                <p className="text-[10px] text-white/50">Login sebagai</p>
                <p className="font-bold text-sm text-white truncate capitalize">{user.name}</p>
              </div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </aside>

      <div className="md:hidden sticky top-0 z-50 bg-[#4A2F1B] text-white border-b border-[#D6A34A]/20 shadow-lg">
        <div className="h-16 px-4 flex items-center justify-between gap-3">
          <a href="/admin/dashboard" className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#D6A34A] text-[#4A2F1B] flex items-center justify-center font-black shrink-0">P</div>
            <div className="min-w-0"><p className="font-black text-sm truncate">Pakde Griya</p><p className="text-[9px] uppercase tracking-wider text-[#D6A34A]">Admin Panel</p></div>
          </a>
          <AdminNavigation mobile />
        </div>
      </div>

      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8 xl:p-10 overflow-x-hidden">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
