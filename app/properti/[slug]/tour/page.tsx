import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import TourViewer from "@/components/TourViewer";
import { getSupabase } from "@/lib/supabase"; 

export const dynamic = "force-dynamic";

export default async function PublicTourPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = getSupabase();
  
  const { data: propertyRecord } = await supabase
    .from("properties")
    .select("id")
    .eq("slug", slug)
    .limit(1);

  if (!propertyRecord || propertyRecord.length === 0) {
    notFound();
  }
  const property = propertyRecord[0];

  // 1. Ambil Data Ruangan dan Media Saja Dulu
  const [scenesRes, mediaRes] = await Promise.all([
    supabase.from("scenes").select(`
      id, name, is_first_scene:is_first_scene, 
      initial_pitch:initial_pitch, initial_yaw:initial_yaw, 
      media_id:media_id, audio_media_id:audio_media_id
    `).eq("property_id", property.id),
    
    supabase.from("property_media").select("id, file_type:file_type").eq("property_id", property.id)
  ]);

  const allScenes = scenesRes.data || [];
  const allMedia = mediaRes.data || [];

  // 2. MENCEGAH ERROR 1102 CLOUDFLARE: Filter hotspot secara ketat
  let allHotspots: any[] = [];
  if (allScenes.length > 0) {
    const sceneIds = allScenes.map(s => s.id);
    const { data } = await supabase
      .from("hotspots")
      .select(`
        id, scene_id:scene_id, target_scene_id:target_scene_id, 
        pitch, yaw, label
      `)
      .in("scene_id", sceneIds);
    allHotspots = data || [];
  }

  // TAMPILAN JIKA BELUM ADA VIRTUAL TOUR
  if (allScenes.length === 0) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#281C15] text-[#D6A34A] font-sans p-6 text-center">
        <h1 className="text-2xl md:text-3xl font-bold mb-3">Virtual Tour Belum Tersedia</h1>
        <p className="text-sm md:text-base opacity-70 mb-8 max-w-md">
          Properti ini belum memiliki ruangan 360° yang didaftarkan.
        </p>
        
        <Link 
          href={`/properti/${slug}`}
          className="flex items-center gap-2 bg-[#D6A34A] text-[#281C15] px-6 py-3 rounded-xl font-bold hover:bg-[#c2913b] transition-all shadow-lg"
        >
          <ArrowLeft size={20} /> Kembali ke Detail Properti
        </Link>
      </div>
    );
  }

  const firstScene = allScenes.find(s => s.is_first_scene) || allScenes[0];
  
  const planetMedia = allMedia.find(m => m.file_type === "intro_planet_public");
  const introPlanetUrl = planetMedia ? `/api/media/${planetMedia.id}` : undefined;

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