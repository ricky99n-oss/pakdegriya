"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Crosshair, Loader2 } from "lucide-react";
import { createHotspotAction } from "@/app/admin/properti/[id]/tour/actions";
import PannellumAssets from "./tour360/PannellumAssets";
import Tour360Styles from "./tour360/Tour360Styles";
import TourEditorSidebar from "./tour360/TourEditorSidebar";
import TourEditorToolbar from "./tour360/TourEditorToolbar";
import TourEditorSceneHeader from "./tour360/TourEditorSceneHeader";
import { errorMessage, parseHotspotLabel, renderTourHotspot } from "./tour360/hotspot";
import type {
  CoordinateValue,
  EditorHotspot,
  EditorScene,
  PannellumViewer,
} from "./tour360/types";

type Props = {
  existingScenes: EditorScene[];
  propertyId: string;
  allHotspots: EditorHotspot[];
  availableAudios: any[];
};

export default function TourEditor({
  existingScenes,
  propertyId,
  allHotspots,
  availableAudios,
}: Props) {
  void availableAudios;

  const viewerRef = useRef<HTMLDivElement>(null);
  const viewerInstance = useRef<PannellumViewer | null>(null);
  const preferredFirst = existingScenes.find((scene) => scene.isFirstScene)?.id;
  const [activeSceneId, setActiveSceneId] = useState(preferredFirst || existingScenes[0]?.id || "");
  const [pitch, setPitch] = useState<CoordinateValue>("");
  const [yaw, setYaw] = useState<CoordinateValue>("");
  const [engineReady, setEngineReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewerError, setViewerError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  const currentScene = useMemo(
    () => existingScenes.find((scene) => scene.id === activeSceneId),
    [existingScenes, activeSceneId]
  );
  const sceneHotspots = useMemo(
    () => allHotspots.filter((hotspot) => hotspot.sceneId === activeSceneId),
    [allHotspots, activeSceneId]
  );
  const mappedHotspots = useMemo(
    () =>
      sceneHotspots.map((hotspot) => {
        const { label, iconType } = parseHotspotLabel(hotspot.label);
        const target = existingScenes.find((scene) => scene.id === hotspot.targetSceneId);
        return {
          pitch: Number(hotspot.pitch) || 0,
          yaw: Number(hotspot.yaw) || 0,
          type: "info",
          cssClass: "pakde-editor-hotspot",
          createTooltipFunc: renderTourHotspot,
          createTooltipArgs: {
            label: label || target?.name || "Menuju Ruangan",
            iconType,
            targetImage: target?.mediaId ? `/api/media/${target.mediaId}` : "",
          },
        };
      }),
    [sceneHotspots, existingScenes]
  );

  useEffect(() => {
    if (currentScene || existingScenes.length === 0) return;
    setActiveSceneId(existingScenes.find((scene) => scene.isFirstScene)?.id || existingScenes[0].id);
  }, [currentScene, existingScenes]);

  useEffect(() => {
    if (!engineReady || !viewerRef.current || !window.pannellum?.viewer || !currentScene?.mediaId) return;

    setLoading(true);
    setViewerError("");
    try {
      viewerInstance.current?.destroy();
    } catch {}
    viewerInstance.current = null;

    let viewer: PannellumViewer | null = null;
    let observer: ResizeObserver | null = null;

    try {
      viewer = window.pannellum.viewer(viewerRef.current, {
        type: "equirectangular",
        panorama: `/api/media/${currentScene.mediaId}`,
        autoLoad: true,
        pitch: Number(currentScene.initialPitch ?? 0),
        yaw: Number(currentScene.initialYaw ?? 0),
        hfov: 90,
        minHfov: 40,
        maxHfov: 120,
        showControls: true,
        showFullscreenCtrl: false,
        crossOrigin: "anonymous",
        escapeHTML: true,
        backgroundColor: [0, 0, 0],
        hotSpots: mappedHotspots,
      });
      viewerInstance.current = viewer;

      viewer.on("load", () => {
        setLoading(false);
        setViewerError("");
        viewer?.resize();
      });
      viewer.on("error", (message: unknown) => {
        setLoading(false);
        setViewerError(errorMessage(message, "Panorama gagal dimuat dari R2."));
      });

      if (typeof ResizeObserver !== "undefined") {
        observer = new ResizeObserver(() => viewer?.resize());
        observer.observe(viewerRef.current);
      }
    } catch (error) {
      setLoading(false);
      setViewerError(errorMessage(error));
    }

    return () => {
      observer?.disconnect();
      try {
        viewer?.destroy();
      } catch {}
      if (viewerInstance.current === viewer) viewerInstance.current = null;
    };
  }, [engineReady, currentScene?.id, currentScene?.mediaId, currentScene?.initialPitch, currentScene?.initialYaw, mappedHotspots, retryKey]);

  const handleCapture = () => {
    const viewer = viewerInstance.current;
    if (!viewer) return;
    setPitch(Number(viewer.getPitch()));
    setYaw(Number(viewer.getYaw()));
  };

  const handleCreateHotspot = async (formData: FormData) => {
    const label = String(formData.get("label") || "").trim();
    const iconType = String(formData.get("iconType") || "door");
    formData.set("label", `${label}|||${iconType}`);
    await createHotspotAction(formData);
    setPitch("");
    setYaw("");
  };

  const selectScene = (id: string) => {
    if (id === activeSceneId) return;
    setPitch("");
    setYaw("");
    setActiveSceneId(id);
  };

  const assetsReady = useCallback(() => setEngineReady(true), []);
  const assetsError = useCallback((message: string) => {
    setLoading(false);
    setViewerError(message);
  }, []);

  if (!currentScene) {
    return <div className="bg-white border rounded-2xl p-8 text-center">Belum ada ruangan 360°.</div>;
  }

  return (
    <div className="space-y-6">
      <PannellumAssets onReady={assetsReady} onError={assetsError} />
      <Tour360Styles />
      <TourEditorToolbar
        scenes={existingScenes}
        activeSceneId={activeSceneId}
        onSelectScene={selectScene}
      />

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#D6A34A]/20">
        <TourEditorSceneHeader scene={currentScene} propertyId={propertyId} />
        <div className="flex flex-col xl:flex-row gap-6">
          <div className="w-full xl:w-2/3 h-[500px] relative bg-black rounded-xl overflow-hidden border-2 border-gray-200">
            {loading && !viewerError && <LoadingOverlay />}
            {viewerError && (
              <ErrorOverlay message={viewerError} onRetry={() => setRetryKey((key) => key + 1)} />
            )}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <Crosshair className="text-[#D6A34A] drop-shadow-md" size={40} strokeWidth={2} />
            </div>
            <div id="tour-canvas-admin" ref={viewerRef} className="w-full h-full cursor-crosshair bg-black" />
          </div>

          <TourEditorSidebar
            currentScene={currentScene}
            scenes={existingScenes}
            hotspots={sceneHotspots}
            propertyId={propertyId}
            pitch={pitch}
            yaw={yaw}
            viewerBusy={loading || !!viewerError}
            onCapture={handleCapture}
            onCreateHotspot={handleCreateHotspot}
          />
        </div>
      </div>
    </div>
  );
}

function LoadingOverlay() {
  return (
    <div className="absolute inset-0 z-20 bg-black flex flex-col items-center justify-center text-white">
      <Loader2 size={36} className="animate-spin text-[#D6A34A] mb-3" />
      <p className="font-bold text-sm">Memuat Panorama 360°</p>
      <p className="text-xs text-white/50 mt-1">Streaming dari Cloudflare R2...</p>
    </div>
  );
}

function ErrorOverlay({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="absolute inset-0 z-30 bg-black/95 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <AlertTriangle size={38} className="text-red-400 mx-auto mb-3" />
        <p className="text-white font-bold">Viewer 360 Gagal Dimuat</p>
        <p className="text-white/60 text-xs mt-2 break-words">{message}</p>
        <button type="button" onClick={onRetry} className="mt-5 bg-[#D6A34A] text-[#281C15] px-5 py-2 rounded-lg text-xs font-bold">
          Coba Muat Ulang
        </button>
      </div>
    </div>
  );
}
