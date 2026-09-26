import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import TourViewer from "@/components/TourViewer";
import { getSupabase } from "@/lib/supabase";
import { validateRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PublicTourPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tourPath = `/properti/${slug}/tour`;
  const { user } = await validateRequest();
  if (!user) redirect(`/auth/masuk?next=${encodeURIComponent(tourPath)}`);

  const role = String(user.role || "member").toLowerCase();
  const isAdmin = role === "admin" || role === "superadmin";
  if (!isAdmin && !String(user.phone || "").trim()) {
    redirect(`/auth/lengkapi-telepon?next=${encodeURIComponent(tourPath)}`);
  }

  const supabase = getSupabase();
  const { data: propertyRecord } = await supabase.from("properties").select("id, title").eq("slug", slug).limit(1);
  if (!propertyRecord?.length) notFound();
  const property = propertyRecord[0];

  const [scenesRes, mediaRes] = await Promise.all([
    supabase
      .from("scenes")
      .select("id, name, is_first_scene, sort_order, initial_pitch, initial_yaw, media_id, audio_media_id, auto_rotate_speed, created_at")
      .eq("property_id", property.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase.from("property_media").select("id, file_type, is_public").eq("property_id", property.id),
  ]);

  const allScenes = scenesRes.data || [];
  const allMedia = mediaRes.data || [];
  let allHotspots: any[] = [];

  if (allScenes.length > 0) {
    const sceneIds = allScenes.map((scene) => scene.id);
    const { data } = await supabase
      .from("hotspots")
      .select("id, scene_id, target_scene_id, pitch, yaw, label")
      .in("scene_id", sceneIds);
    allHotspots = data || [];
  }

  if (allScenes.length === 0) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#281C15] text-[#D6A34A] font-sans p-6 text-center">
        <h1 className="text-2xl md:text-3xl font-bold mb-3">Virtual Tour Belum Tersedia</h1>
        <p className="text-sm md:text-base opacity-70 mb-8 max-w-md">Properti ini belum memiliki ruangan 360° yang didaftarkan.</p>
        <Link href={`/properti/${slug}`} className="flex items-center gap-2 bg-[#D6A34A] text-[#281C15] px-6 py-3 rounded-xl font-bold hover:bg-[#c2913b] transition-all shadow-lg">
          <ArrowLeft size={20} /> Kembali ke Detail Properti
        </Link>
      </div>
    );
  }

  const firstScene = allScenes[0];
  const planetMedia = allMedia.find((media) => media.file_type === "intro_planet_public");
  const introPlanetUrl = planetMedia ? `/api/media/${planetMedia.id}` : undefined;

  const tourConfig: any = {
    default: {
      firstScene: firstScene.id,
      sceneFadeDuration: 700,
      autoLoad: true,
      autoRotate: -0.35,
      autoRotateInactivityDelay: 4000,
    },
    scenes: {},
  };

  allScenes.forEach((scene) => {
    const sceneHotspots = allHotspots
      .filter((hotspot) => hotspot.scene_id === scene.id)
      .map((hotspot) => ({
        pitch: hotspot.pitch,
        yaw: hotspot.yaw,
        type: "scene",
        text: hotspot.label,
        sceneId: hotspot.target_scene_id,
      }));

    const mediaUrl = `/api/media/${scene.media_id}`;
    const previewUrl = `/api/media/${scene.media_id}?preview=1`;
    const configuredSpeed = Math.abs(Number(scene.auto_rotate_speed));
    const slowSpeed = configuredSpeed > 0 && configuredSpeed <= 0.8 ? configuredSpeed : 0.35;

    tourConfig.scenes[scene.id] = {
      title: scene.name,
      type: "equirectangular",
      panorama: mediaUrl,
      preview: previewUrl,
      thumbnail: previewUrl,
      pitch: Number(scene.initial_pitch ?? 0),
      yaw: Number(scene.initial_yaw ?? 0),
      hfov: 120,
      minHfov: 55,
      maxHfov: 140,
      autoRotate: -slowSpeed,
      autoRotateInactivityDelay: 4000,
      customAudioUrl: scene.audio_media_id ? `/api/media/${scene.audio_media_id}` : null,
      hotSpots: sceneHotspots,
    };
  });

  return <TourViewer tourConfig={tourConfig} introPlanetUrl={introPlanetUrl} exitUrl={`/properti/${slug}`} propertyTitle={property.title} />;
}
