"use client";

import { Share2, Check } from "lucide-react";
import { useState } from "react";

export default function ShareButton({ title, slug, className = "" }: { title: string, slug: string, className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();

    const url = `${window.location.origin}/properti/${slug}`;
    const shareData = {
      title: "Pakde Griya Properti",
      text: `Cek properti menarik ini di Pakde Griya: ${title}`,
      url: url,
    };

    // Deteksi jika browser/HP mendukung menu Share bawaan (Android/iOS/Mac/Win11)
    if (navigator.share && /mobile|android|iphone|ipad/i.test(navigator.userAgent.toLowerCase())) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("Share dibatalkan pengguna");
      }
    } else {
      // Fallback untuk PC: Otomatis Copy Link
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        alert("Tautan properti berhasil disalin!");
        setTimeout(() => setCopied(false), 3000);
      } catch (err) {
        console.error("Gagal menyalin tautan");
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className={`bg-white/90 backdrop-blur-md p-2 rounded-full text-[#4A2F1B] shadow-md border border-white/50 hover:bg-[#D6A34A] hover:text-white transition-all flex items-center justify-center ${className}`}
      title="Bagikan Properti"
    >
      {copied ? <Check size={18} className="text-green-600 group-hover:text-white" /> : <Share2 size={18} />}
    </button>
  );
}