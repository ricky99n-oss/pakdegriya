"use client";

import { Share2, Check } from "lucide-react";
import { useState } from "react";

export default function ShareButton({ title, slug }: { title: string, slug: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault(); // Mencegah klik menembus ke link detail properti
    e.stopPropagation();

    const url = `${window.location.origin}/properti/${slug}`;
    const shareData = {
      title: "Pakde Griya Properti",
      text: `Cek properti menarik ini di Pakde Griya: ${title}`,
      url: url,
    };

    // Deteksi jika browser/HP mendukung native share (Android/iOS/Mac/Win11)
    if (navigator.share && /mobile|android|iphone|ipad/i.test(navigator.userAgent.toLowerCase())) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("Share dibatalkan", err);
      }
    } else {
      // Fallback: Jika dibuka di PC/Browser lama, otomatis Copy Link
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        alert("Link properti berhasil disalin!");
      } catch (err) {
        console.error("Gagal menyalin link");
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-2 rounded-full text-[#4A2F1B] shadow-md border border-white/50 hover:bg-[#D6A34A] hover:text-white transition-all z-20 group flex items-center justify-center w-8 h-8"
      title="Bagikan Properti"
    >
      {copied ? <Check size={16} className="text-green-600 group-hover:text-white" /> : <Share2 size={16} />}
    </button>
  );
}