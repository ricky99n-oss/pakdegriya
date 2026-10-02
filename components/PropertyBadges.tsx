import { Flame } from "lucide-react";

export function HotItemBadge() {
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-[#B83A16] px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-white shadow-md"><Flame size={14} aria-hidden="true" /> Hot Item</span>;
}

export function NegoBadge() {
  return <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">Nego</span>;
}
