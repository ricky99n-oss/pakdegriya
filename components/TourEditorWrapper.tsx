"use client";

import dynamic from "next/dynamic";

// Memindahkan import dinamis ke dalam Client Component (Aman dari Error Build)
const TourEditor = dynamic(() => import("./TourEditor"), {
  ssr: false, 
  loading: () => (
    <div className="w-full h-[500px] flex items-center justify-center bg-gray-100 rounded-2xl border-2 border-dashed border-[#D6A34A]/50 animate-pulse">
      <p className="text-[#4A2F1B] font-bold">Memuat Editor 3D...</p>
    </div>
  )
});

export default function TourEditorWrapper(props: any) {
  return <TourEditor {...props} />;
}