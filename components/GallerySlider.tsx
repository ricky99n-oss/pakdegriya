"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function GallerySlider({ images }: { images: { id: string }[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      // Geser sejauh 320px setiap kali panah diklik
      const scrollAmount = direction === "left" ? -320 : 320;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  if (!images || images.length === 0) return null;

  return (
    <div className="pt-2 md:pt-4 relative group">
      <h3 className="text-lg md:text-xl font-bold text-[#4A2F1B] mb-4 border-l-4 border-[#D6A34A] pl-3">Galeri Properti</h3>
      
      {/* Tombol Kiri (Muncul saat di-hover pada desktop) */}
      <button 
        onClick={() => scroll("left")} 
        className="absolute left-2 top-[60%] -translate-y-1/2 z-20 bg-white/90 p-2.5 rounded-full shadow-lg text-[#4A2F1B] hover:bg-[#D6A34A] hover:text-white transition-colors hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100"
      >
        <ChevronLeft size={24} />
      </button>

      {/* Kontainer Galeri */}
      <div 
        ref={scrollRef} 
        className="flex gap-3 md:gap-4 overflow-x-auto snap-x snap-mandatory pb-4 hide-scroll cursor-grab active:cursor-grabbing items-start scroll-smooth"
      >
        {images.map((img) => (
          <div key={img.id} className="w-[280px] h-[210px] md:w-[320px] md:h-[240px] bg-gray-100 rounded-2xl relative overflow-hidden group/item snap-center shadow-sm shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={`/api/media/${img.id}`} 
              alt="Galeri Properti" 
              loading="lazy" 
              className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500" 
            />
          </div>
        ))}
      </div>

      {/* Tombol Kanan */}
      <button 
        onClick={() => scroll("right")} 
        className="absolute right-2 top-[60%] -translate-y-1/2 z-20 bg-white/90 p-2.5 rounded-full shadow-lg text-[#4A2F1B] hover:bg-[#D6A34A] hover:text-white transition-colors hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100"
      >
        <ChevronRight size={24} />
      </button>

      {images.length > 2 && (
        <p className="text-center text-[10px] md:text-xs text-gray-400 mt-1 italic">
          Geser ke samping atau gunakan panah untuk melihat foto lainnya
        </p>
      )}
    </div>
  );
}