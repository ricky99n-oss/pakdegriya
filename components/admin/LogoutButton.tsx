"use client";

import { useFormStatus } from "react-dom";
import { LogOut, Loader2 } from "lucide-react";
import { keluarAction } from "@/app/auth/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-red-500/20 text-white/80 hover:text-red-200 transition-all text-sm font-bold disabled:opacity-50"
    >
      {pending ? <Loader2 size={17} className="animate-spin" /> : <LogOut size={17} />}
      {pending ? "Keluar..." : "Keluar"}
    </button>
  );
}

export default function LogoutButton() {
  return <form action={keluarAction}><SubmitButton /></form>;
}
