import Link from "next/link";
import { validateRequest } from "../../lib/auth";
import { redirect } from "next/navigation";
import { LayoutDashboard, Home, UserCircle, ExternalLink } from "lucide-react";
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

        <nav className="flex-1 px-4 py-5 space-y-2">
          <Link href="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/75 hover:text-white hover:bg-white/10 transition-all group">
            <LayoutDashboard size={19} className="group-hover:text-[#D6A34A] transition-colors" />
            <span className="font-medium text-sm">Dashboard</span>
          </Link>
          <Link href="/admin/properti" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white text-[#4A2F1B] shadow-md transition-all font-bold">
            <Home size={19} className="text-[#D6A34A]" />
            <span className="text-sm">Kelola Properti</span>
          </Link>
          <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all">
            <ExternalLink size={18} />
            <span className="text-sm font-medium">Lihat Website</span>
          </Link>
        </nav>

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
          <Link href="/admin/dashboard" className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#D6A34A] text-[#4A2F1B] flex items-center justify-center font-black shrink-0">P</div>
            <div className="min-w-0"><p className="font-black text-sm truncate">Pakde Griya</p><p className="text-[9px] uppercase tracking-wider text-[#D6A34A]">Admin Panel</p></div>
          </Link>
          <div className="flex items-center gap-1">
            <Link href="/admin/dashboard" className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10" aria-label="Dashboard"><LayoutDashboard size={19} /></Link>
            <Link href="/admin/properti" className="w-10 h-10 rounded-xl flex items-center justify-center bg-white text-[#4A2F1B]" aria-label="Kelola Properti"><Home size={19} /></Link>
          </div>
        </div>
      </div>

      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8 xl:p-10 overflow-x-hidden">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
