import Link from "next/link";
import { validateRequest } from "../../lib/auth";
import { redirect } from "next/navigation";
import { LayoutDashboard, Home, UserCircle } from "lucide-react";
import LogoutButton from "@/components/admin/LogoutButton";

export const runtime = "edge";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await validateRequest();

  if (!user || (user.role !== "superadmin" && user.role !== "admin")) {
    redirect("/auth/masuk");
  }

  return (
    <div className="min-h-screen flex bg-[#FFF7E8]">
      <aside className="w-72 bg-[#4A2F1B] text-white flex flex-col shadow-2xl z-10">
        <div className="p-8 flex items-center gap-4 border-b border-white/10">
          <div className="w-10 h-10 rounded-xl bg-[#D6A34A] flex items-center justify-center text-[#4A2F1B] font-bold text-xl shadow-lg">P</div>
          <div>
            <h2 className="text-xl font-bold tracking-wide text-white">Pakde Griya</h2>
            <p className="text-xs text-[#D6A34A] tracking-wider uppercase">Admin Panel</p>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-2">
          <Link href="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all group">
            <LayoutDashboard size={20} className="group-hover:text-[#D6A34A] transition-colors" />
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link href="/admin/properti" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white text-[#4A2F1B] shadow-md transition-all font-bold">
            <Home size={20} className="text-[#D6A34A]" />
            <span>Kelola Properti</span>
          </Link>
        </nav>

        <div className="p-6">
          <div className="p-4 rounded-2xl bg-black/20 backdrop-blur-sm border border-white/10">
            <div className="flex items-center gap-3">
              <UserCircle size={36} className="text-[#D6A34A]" />
              <div className="overflow-hidden">
                <p className="text-xs text-white/50">Login sebagai</p>
                <p className="font-bold text-white truncate capitalize">{user.name}</p>
              </div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </aside>

      <main className="flex-1 p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
