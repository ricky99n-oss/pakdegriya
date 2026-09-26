import { notFound } from "next/navigation";
import TourViewer from "@/components/TourViewer";
import { getSupabase } from "@/lib/supabase"; // <- Menggunakan Supabase REST

export const dynamic = "force-dynamic";

export default async function PublicTourPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = getSupabase();
  
  // 1. Ambil data properti berdasarkan Slug (REST API)
  const { data: propertyRecord } = await supabase
    .from("properties")
    .select("id")
    .eq("slug", slug)
    .limit(1);

  if (!propertyRecord || propertyRecord.length === 0) {
    notFound();
  }
  const property = propertyRecord[0];

  // 2. Ambil semua ruangan, hotspot, dan media secara paralel
  const [scenesRes, hotspotsRes, mediaRes] = await Promise.all([
    supabase.from("scenes").select(`
      id, name, is_first_scene:is_first_scene, 
      initial_pitch:initial_pitch, initial_yaw:initial_yaw, 
      media_id:media_id, audio_media_id:audio_media_id
    `).eq("property_id", property.id),
    
    // Asumsi tabel hotspots terkait dengan scene yang terkait dengan property ini
    supabase.from("hotspots").select(`
      id, scene_id:scene_id, target_scene_id:target_scene_id, 
      pitch, yaw, label
    `),
    
    supabase.from("property_media").select("id, file_type:file_type").eq("property_id", property.id)
  ]);

  const allScenes = scenesRes.data || [];
  const allHotspots = hotspotsRes.data || [];
  const allMedia = mediaRes.data || [];

  if (allScenes.length === 0) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#281C15] text-[#D6A34A] font-sans">
        <h1 className="text-2xl font-bold mb-2">Virtual Tour Belum Tersedia</h1>
        <p className="text-sm opacity-70">Properti ini belum memiliki ruangan 360° yang didaftarkan.</p>
      </div>
    );
  }

  // 3. Tentukan Ruangan Pertama (Berdasarkan setelan di Admin)
  const firstScene = allScenes.find(s => s.is_first_scene) || allScenes[0];
  
  // 4. Cari Media "Little Planet"
  const planetMedia = allMedia.find(m => m.file_type === "intro_planet_public");
  const introPlanetUrl = planetMedia ? `/api/media/${planetMedia.id}` : undefined;

  // 5. Susun JSON Config untuk mesin Pannellum
  const tourConfig: any = {
    default: {
      firstScene: firstScene.id,
      sceneFadeDuration: 1000,
      autoLoad: true,
    },
    scenes: {}
  };

  allScenes.forEach(scene => {
    const sceneHotspots = allHotspots
      .filter(h => h.scene_id === scene.id)
      .map(hs => ({
        pitch: hs.pitch,
        yaw: hs.yaw,
        type: "scene",
        text: hs.label,
        sceneId: hs.target_scene_id
      }));

    tourConfig.scenes[scene.id] = {
      title: scene.name,
      type: "equirectangular",
      panorama: `/api/media/${scene.media_id}`,
      pitch: scene.initial_pitch || 0,
      yaw: scene.initial_yaw || 0,
      // SETELAN BARU: Mengunci lensa kamera agar tidak terlalu nge-zoom/pecah
      hfov: 110,
      minHfov: 50,
      maxHfov: 150,
      customAudioUrl: scene.audio_media_id ? `/api/media/${scene.audio_media_id}` : null,
      hotSpots: sceneHotspots
    };
  });

  return (
    <TourViewer 
      tourConfig={tourConfig} 
      introPlanetUrl={introPlanetUrl} 
    />
  );
}