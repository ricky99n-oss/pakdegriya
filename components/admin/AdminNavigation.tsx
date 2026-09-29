"use client";
import { usePathname } from "next/navigation";
import { ExternalLink, Home, LayoutDashboard, Users } from "lucide-react";
const links = [{ href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard }, { href: "/admin/properti", label: "Kelola Properti", icon: Home }, { href: "/admin/member", label: "Kelola Member", icon: Users }, { href: "/", label: "Lihat Website", icon: ExternalLink }];
export default function AdminNavigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  return <nav aria-label="Navigasi admin" className={mobile ? "flex items-center gap-1" : "flex-1 px-4 py-5 space-y-2"}>{links.filter((link) => !mobile || link.href !== "/").map(({ href, label, icon: Icon }) => {
    const active = href !== "/" && pathname.startsWith(href);
    return <a key={href} href={href} aria-label={label} aria-current={active ? "page" : undefined} className={`${mobile ? "w-10 h-10 justify-center" : "gap-3 px-4 py-3"} flex items-center rounded-xl transition-colors ${active ? "bg-white text-[#4A2F1B] font-bold" : "text-white/75 hover:bg-white/10 hover:text-white"}`}><Icon size={19} />{!mobile && <span className="text-sm">{label}</span>}</a>;
  })}</nav>;
}
