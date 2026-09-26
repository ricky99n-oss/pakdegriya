import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Map } from "lucide-react";
import { createSceneAction } from "./actions";
import TourEditorWrapper from "@/components/TourEditorWrapper";
import { getSupabase } from "@/lib/supabase";

export default async function KelolaTurProperti({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabase();

  const { data: propertyRecord } = await supabase.from("properties").select("*").eq("id", id).limit(1);
  if (!propertyRecord || propertyRecord.length === 0) notFound();
  const property = propertyRecord[0];

  // Eksekusi pemanggilan database paralel
  const [mediaRes, scenesRes, hotspotsRes] = await Promise.all([
    supabase.from("property_media").select("*").eq("property_id", id),
    supabase.from("scenes").select("*").eq("property_id", id),
    // Anggap hotspots tabel mandiri tanpa relasi langsung property_id
    supabase.from("hotspots").select("*") 
  ]);

  const allMedia = mediaRes.data || [];
  const panoramas = allMedia.filter(m => m.file_type === "panorama_private");
  const audios = allMedia.filter(m => m.file_type === "audio_private").map(a => ({
    id: a.id,
    fileName: a.file_name // Dikonversi karena dibutuhkan oleh komponen UI Client
  }));
  
  // Konversi property name yang dipakai oleh Client Component (React)
  const existingScenes = (scenesRes.data || []).map(s => ({
    id: s.id,
    mediaId: s.media_id,
    name: s.name,
    isFirstScene: s.is_first_scene,
    initialPitch: s.initial_pitch,
    initialYaw: s.initial_yaw,
    audioMediaId: s.audio_media_id
  }));

  const allHotspots = (hotspotsRes.data || []).map(h => ({
    id: h.id,
    sceneId: h.scene_id,
    targetSceneId: h.target_scene_id,
    pitch: h.pitch,
    yaw: h.yaw,
    label: h.label
  }));

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

      <div className="bg-[#FFF7E8] p-6 rounded-2xl border border-[#D6A34A]/30 shadow-sm">
        <h2 className="text-xl font-bold text-[#4A2F1B] mb-4">1. Daftarkan Ruangan Baru</h2>
        <p className="text-sm text-[#4A2F1B]/70 mb-4">
          Pilih file Panorama 360 yang sudah Anda unggah, beri nama ruangan (misal: Ruang Tamu), lalu klik tombol "+" untuk memasukkannya ke dalam Tur.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {panoramas.map((pano: any) => {
            const registeredScene = existingScenes.find((s: any) => s.mediaId === pano.id);
            const isRegistered = !!registeredScene;
            
            return (
              <form 
                key={pano.id} 
                action={createSceneAction} 
                className={`flex items-center gap-3 bg-white p-3 rounded-xl border ${isRegistered ? 'border-green-300 bg-green-50' : 'border-[#D6A34A]/50'} shadow-sm`}
              >
                <input type="hidden" name="propertyId" value={property.id} />
                
                <div className="w-16 h-12 bg-gray-200 rounded-lg overflow-hidden shrink-0 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/media/${pano.id}`} alt="Thumb" className="w-full h-full object-cover" />
                  {isRegistered && (
                    <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                      <span className="text-green-800 text-xs font-bold">✔</span>
                    </div>
                  )}
                </div>
                
                <input 
                  type="text" 
                  name={`name_${pano.id}`} 
                  placeholder="Ketik Nama Ruangan..." 
                  defaultValue={isRegistered ? registeredScene.name : ""}
                  disabled={isRegistered} 
                  required={!isRegistered}
                  className="w-full border-none focus:ring-0 text-sm bg-transparent font-bold text-[#281C15] placeholder-gray-400 disabled:opacity-70" 
                />
                
                <button 
                  type="submit" 
                  name="mediaId" 
                  value={pano.id} 
                  disabled={isRegistered} 
                  className="w-10 h-10 rounded-lg bg-[#4A2F1B] text-[#D6A34A] flex items-center justify-center hover:bg-[#281C15] disabled:bg-gray-200 disabled:text-gray-400 shrink-0 transition-colors"
                >
                  {isRegistered ? '✔' : '+'}
                </button>
              </form>
            );
          })}
        </div>

        {panoramas.length === 0 && (
          <p className="text-sm text-red-500 font-bold bg-white p-4 rounded-xl mt-4">Anda belum mengunggah media Panorama 360 di halaman edit properti.</p>
        )}
      </div>

      {existingScenes.length > 0 ? (
        <div className="mt-8 border-t border-gray-200 pt-8">
          <h2 className="text-xl font-bold text-[#4A2F1B] mb-6">2. Sambungkan Antar Ruangan (Hotspot)</h2>
          <TourEditorWrapper 
            existingScenes={existingScenes} 
            propertyId={property.id} 
            allHotspots={allHotspots}
            availableAudios={audios}
          />
        </div>
      ) : (
        <div className="mt-8 border-t border-gray-200 pt-8 text-center text-gray-500 font-medium">
          Daftarkan minimal satu ruangan di atas untuk mulai memunculkan Editor Tur 360°.
        </div>
      )}

    </div>
  );
}