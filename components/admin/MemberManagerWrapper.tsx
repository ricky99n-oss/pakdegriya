"use client";
import dynamic from "next/dynamic";

// Excel/PDF generation belongs entirely in the browser. Do not include its
// document libraries in the Cloudflare Worker used to render the admin page.
const MemberManager = dynamic(() => import("./MemberManager"), {
  ssr: false,
  loading: () => <div role="status" className="rounded-2xl bg-white border p-6 text-[#4A2F1B]">Memuat pengelola member...</div>,
});
export default MemberManager;
