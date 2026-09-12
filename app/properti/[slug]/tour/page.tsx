import { db } from "@/db";
import { properties, scenes, hotspots, propertyMedia } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import TourViewer from "@/components/TourViewer";

export default async function PublicTourPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // 1. Ambil data properti berdasarkan Slug
  const propertyRecord = await db.select().from(properties).where(eq(properties.slug, slug));
  if (propertyRecord.length === 0) notFound();
  const property = propertyRecord[0];

  // 2. Ambil semua ruangan, hotspot, dan media
  const allScenes = await db.select().from(scenes).where(eq(scenes.propertyId, property.id));
  const allHotspots = await db.select().from(hotspots);
  const allMedia = await db.select().from(propertyMedia).where(eq(propertyMedia.propertyId, property.id));

  if (allScenes.length === 0) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#281C15] text-[#D6A34A] font-sans">
        <h1 className="text-2xl font-bold mb-2">Virtual Tour Belum Tersedia</h1>
        <p className="text-sm opacity-70">Properti ini belum memiliki ruangan 360° yang didaftarkan.</p>
      </div>
    );
  }

  // 3. Tentukan Ruangan Pertama (Berdasarkan setelan bintang di Admin)
  const firstScene = allScenes.find(s => s.isFirstScene) || allScenes[0];
  
  // 4. Cari Media "Little Planet"
  const planetMedia = allMedia.find(m => m.fileType === "intro_planet_public");
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
      .filter(h => h.sceneId === scene.id)
      .map(hs => ({
        pitch: hs.pitch,
        yaw: hs.yaw,
        type: "scene",
        text: hs.label,
        sceneId: hs.targetSceneId
      }));

    tourConfig.scenes[scene.id] = {
      title: scene.name,
      type: "equirectangular",
      panorama: `/api/media/${scene.mediaId}`,
      pitch: scene.initialPitch || 0,
      yaw: scene.initialYaw || 0,
      // SETELAN BARU: Mengunci lensa kamera agar tidak terlalu nge-zoom/pecah
      hfov: 110,
      minHfov: 50,
      maxHfov: 150,
      customAudioUrl: scene.audioMediaId ? `/api/media/${scene.audioMediaId}` : null,
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