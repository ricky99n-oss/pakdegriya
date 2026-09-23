import { db } from "@/db";
import { properties, propertyMedia, scenes, hotspots } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Map } from "lucide-react";
import { createSceneAction } from "./actions";

// IMPORT KOMPONEN WRAPPER YANG BARU (Bukan TourEditor langsung)
import TourEditorWrapper from "@/components/TourEditorWrapper";

export default async function KelolaTurProperti(props: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = await Promise.resolve(props.params);
  const id = resolvedParams.id;

  const propertyRecord = await db.select().from(properties).where(eq(properties.id, id));
  if (propertyRecord.length === 0) notFound();
  const property = propertyRecord[0];

  const panoramas = await db.select().from(propertyMedia).where(and(eq(propertyMedia.propertyId, id), eq(propertyMedia.fileType, "panorama_private")));
  const audios = await db.select().from(propertyMedia).where(and(eq(propertyMedia.propertyId, id), eq(propertyMedia.fileType, "audio_private")));
  
  const existingScenes = await db.select().from(scenes).where(eq(scenes.propertyId, id));
  const allHotspots = await db.select().from(hotspots); 

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <Link href={`/admin/properti/${property.id}`} className="p-2 bg-white rounded-xl shadow-sm border border-[#D6A34A]/20 hover:bg-[#FFF7E8] transition-colors">
          <ArrowLeft size={24} className="text-[#4A2F1B]" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold text-[#281C15] flex items-center gap-3">
            <Map className="text-[#D6A34A]" /> Editor Tur 360°
          </h1>
          <p className="text-[#4A2F1B]/70 font-mono text-sm mt-1">{property.title}</p>
        </div>
      </div>

      <div className="bg-[#FFF7E8] p-6 rounded-2xl border border-[#D6A34A]/30">
        <h2 className="text-xl font-bold text-[#4A2F1B] mb-4">Daftarkan Ruangan Baru</h2>
        <form action={createSceneAction} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="hidden" name="propertyId" value={property.id} />
          {panoramas.map(pano => {
            const isRegistered = existingScenes.some(s => s.mediaId === pano.id);
            return (
              <div key={pano.id} className={`flex items-center gap-3 bg-white p-3 rounded-xl border ${isRegistered ? 'border-green-300 opacity-60' : 'border-[#D6A34A]/50'} shadow-sm`}>
                <div className="w-16 h-12 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/media/${pano.id}`} alt="Thumb" className="w-full h-full object-cover" />
                </div>
                <input type="text" name={`name_${pano.id}`} placeholder="Nama Ruangan..." disabled={isRegistered} className="w-full border-none focus:ring-0 text-sm bg-transparent font-bold text-[#281C15]" />
                <button type="submit" name="mediaId" value={pano.id} disabled={isRegistered} className="w-10 h-10 rounded-lg bg-[#4A2F1B] text-[#D6A34A] flex items-center justify-center hover:bg-[#281C15] disabled:bg-gray-200 disabled:text-gray-400 shrink-0 transition-colors">
                  +
                </button>
              </div>
            );
          })}
        </form>
        {panoramas.length === 0 && (
          <p className="text-sm text-red-500 font-bold bg-white p-4 rounded-xl">Anda belum mengunggah media Panorama 360 di halaman sebelumnya.</p>
        )}
      </div>

      {/* PANGGIL KOMPONEN WRAPPER DI SINI */}
      <TourEditorWrapper 
        existingScenes={existingScenes} 
        propertyId={property.id} 
        allHotspots={allHotspots}
        availableAudios={audios}
      />

    </div>
  );
}