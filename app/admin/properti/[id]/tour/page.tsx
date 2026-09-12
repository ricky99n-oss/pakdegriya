import { db } from "@/db";
import { properties, propertyMedia, scenes, hotspots } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import Link from "next/link";
import { ArrowLeft, Map, Plus } from "lucide-react";
import { createSceneAction } from "./actions";
import TourEditor from "@/components/TourEditor";

export default async function TourManagerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = (await db.select().from(properties).where(eq(properties.id, id)))[0];

  const panoramas = await db.select().from(propertyMedia)
    .where(and(eq(propertyMedia.propertyId, id), eq(propertyMedia.fileType, "panorama_private")));

  const audios = await db.select().from(propertyMedia)
    .where(and(eq(propertyMedia.propertyId, id), eq(propertyMedia.fileType, "audio_private")));

  const existingScenes = await db.select().from(scenes).where(eq(scenes.propertyId, id));
  const allHotspots = await db.select().from(hotspots);

  const unusedPanoramas = panoramas.filter(p => !existingScenes.some(s => s.mediaId === p.id));

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <Link href={`/admin/properti/${id}`} className="p-2 bg-white rounded-xl shadow-sm border border-[#D6A34A]/20 hover:bg-[#FFF7E8]">
          <ArrowLeft size={24} className="text-[#4A2F1B]" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold text-[#281C15] flex items-center gap-3">
            <Map className="text-[#D6A34A]" /> Editor Tur 360°
          </h1>
          <p className="text-[#4A2F1B]/70 font-mono text-sm mt-1">{property.title}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#D6A34A]/20">
        <h2 className="text-xl font-bold text-[#4A2F1B] mb-4">Daftarkan Ruangan Baru</h2>
        {unusedPanoramas.length === 0 ? (
          <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-xl border border-dashed">Semua gambar panorama 360° yang diunggah sudah terdaftar sebagai ruangan.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {unusedPanoramas.map(pano => (
              <form key={pano.id} action={createSceneAction} className="flex gap-2 items-center bg-[#FFF7E8] p-3 rounded-xl border border-[#D6A34A]/30">
                <input type="hidden" name="propertyId" value={id} />
                <input type="hidden" name="mediaId" value={pano.id} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/media/${pano.id}`} alt="pano" className="w-16 h-10 object-cover rounded shadow-sm" />
                <input type="text" name="name" required placeholder="Nama Ruangan..." className="flex-1 p-2 text-sm rounded-lg border border-[#D6A34A]/50 focus:outline-none text-[#281C15]" />
                <button type="submit" className="bg-[#4A2F1B] text-[#D6A34A] p-2 rounded-lg hover:bg-[#281C15]"><Plus size={20}/></button>
              </form>
            ))}
          </div>
        )}
      </div>

      {existingScenes.length > 0 && (
        <TourEditor 
          existingScenes={existingScenes} 
          propertyId={id} 
          allHotspots={allHotspots}
          availableAudios={audios}
        />
      )}
    </div>
  );
}