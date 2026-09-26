"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PannellumAssets from "./tour360/PannellumAssets";
import Tour360Styles from "./tour360/Tour360Styles";
import TourViewerUI from "./tour360/TourViewerUI";
import { errorMessage, parseHotspotLabel, renderTourHotspot } from "./tour360/hotspot";
import type { PannellumViewer, PublicTourConfig } from "./tour360/types";

type Props = {
  tourConfig: PublicTourConfig;
  introPlanetUrl?: string;
};

export default function TourViewer({ tourConfig, introPlanetUrl }: Props) {
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const viewerInstance = useRef<PannellumViewer | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioEnabledRef = useRef(false);

  const sceneIds = useMemo(() => Object.keys(tourConfig?.scenes || {}), [tourConfig?.scenes]);
  const firstScene = tourConfig?.default?.firstScene || sceneIds[0] || "";

  const [engineReady, setEngineReady] = useState(false);
  const [currentSceneId, setCurrentSceneId] = useState(firstScene);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewerError, setViewerError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [showTools, setShowTools] = useState(true);
  const [showGallery, setShowGallery] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const pannellumScenes = useMemo(() => {
    return Object.fromEntries(
      sceneIds.map((id) => {
        const scene = tourConfig.scenes[id];
        const hotSpots = (scene.hotSpots || [])
          .filter((hotspot) => hotspot.sceneId && tourConfig.scenes[hotspot.sceneId])
          .map((hotspot) => {
            const target = tourConfig.scenes[hotspot.sceneId!];
            const { label, iconType } = parseHotspotLabel(hotspot.text);
            return {
              pitch: Number(hotspot.pitch) || 0,
              yaw: Number(hotspot.yaw) || 0,
              type: "scene",
              sceneId: hotspot.sceneId,
              cssClass: "pakde-scene-hotspot",
              createTooltipFunc: renderTourHotspot,
              createTooltipArgs: {
                label: label || target?.title || "Pindah Ruangan",
                iconType,
                targetImage: target?.thumbnail || "",
                animated: true,
              },
            };
          });

        return [
          id,
          {
            type: scene.type || "equirectangular",
            panorama: scene.panorama,
            pitch: Number(scene.pitch ?? 0),
            yaw: Number(scene.yaw ?? 0),
            hfov: Number(scene.hfov ?? 90),
            minHfov: Number(scene.minHfov ?? 50),
            maxHfov: Number(scene.maxHfov ?? 120),
            hotSpots,
          },
        ];
      })
    );
  }, [sceneIds, tourConfig.scenes]);

  const playSceneAudio = useCallback(
    (sceneId: string) => {
      const audio = audioRef.current;
      const source = tourConfig.scenes[sceneId]?.customAudioUrl;
      if (!audio || !source) {
        audio?.pause();
        if (audio) audio.removeAttribute("src");
        setIsAudioPlaying(false);
        return;
      }

      if (audio.getAttribute("src") !== source) {
        audio.pause();
        audio.src = source;
        audio.load();
      }
      audio
        .play()
        .then(() => setIsAudioPlaying(true))
        .catch(() => setIsAudioPlaying(false));
    },
    [tourConfig.scenes]
  );

  useEffect(() => {
    const audio = new Audio();
    audio.loop = true;
    audio.preload = "none";
    audioRef.current = audio;

    const onFullscreen = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFullscreen);

    return () => {
      audio.pause();
      audio.removeAttribute("src");
      document.removeEventListener("fullscreenchange", onFullscreen);
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!engineReady || !viewerRef.current || !window.pannellum?.viewer || !firstScene) return;

    setLoading(true);
    setViewerError("");
    try {
      viewerInstance.current?.destroy();
    } catch {}
    viewerInstance.current = null;
    setCurrentSceneId(firstScene);

    let viewer: PannellumViewer | null = null;
    let observer: ResizeObserver | null = null;

    try {
      viewer = window.pannellum.viewer(viewerRef.current, {
        default: {
          firstScene,
          autoLoad: true,
          sceneFadeDuration: Number(tourConfig.default?.sceneFadeDuration ?? 700),
          showControls: false,
          crossOrigin: "anonymous",
          escapeHTML: true,
          backgroundColor: [0, 0, 0],
        },
        scenes: pannellumScenes,
      });
      viewerInstance.current = viewer;

      viewer.on("load", () => {
        setLoading(false);
        setViewerError("");
        viewer?.resize();
      });
      viewer.on("scenechange", (sceneId: string) => {
        setCurrentSceneId(sceneId);
        setLoading(true);
        setShowGallery(false);
        if (audioEnabledRef.current) playSceneAudio(sceneId);
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
  }, [engineReady, firstScene, pannellumScenes, playSceneAudio, retryKey, tourConfig.default?.sceneFadeDuration]);

  const startTour = (withAudio: boolean) => {
    setStarted(true);
    audioEnabledRef.current = withAudio;
    if (withAudio) playSceneAudio(currentSceneId);
    else setIsAudioPlaying(false);

    const viewer = viewerInstance.current;
    if (viewer) {
      viewer.setHfov(Math.min(120, viewer.getHfov() + 20), false);
      viewer.lookAt(viewer.getPitch(), viewer.getYaw(), 90, 1200);
    }
    window.setTimeout(() => setShowGuide(true), 900);
  };

  const toggleAudio = () => {
    if (audioEnabledRef.current && isAudioPlaying) {
      audioEnabledRef.current = false;
      audioRef.current?.pause();
      setIsAudioPlaying(false);
    } else {
      audioEnabledRef.current = true;
      playSceneAudio(currentSceneId);
    }
  };

  const changeScene = (id: string) => {
    if (!tourConfig.scenes[id]) return;
    if (id === currentSceneId) {
      setShowGallery(false);
      return;
    }
    setLoading(true);
    viewerInstance.current?.loadScene(id);
  };

  const moveScene = (direction: -1 | 1) => {
    if (sceneIds.length < 2) return;
    const index = Math.max(0, sceneIds.indexOf(currentSceneId));
    const next = (index + direction + sceneIds.length) % sceneIds.length;
    changeScene(sceneIds[next]);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) viewerContainerRef.current?.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  };

  const assetsReady = useCallback(() => setEngineReady(true), []);
  const assetsError = useCallback((message: string) => {
    setLoading(false);
    setViewerError(message);
  }, []);

  if (!firstScene) {
    return <div className="w-full h-screen bg-black text-white flex items-center justify-center">Virtual Tour belum tersedia.</div>;
  }

  return (
    <div ref={viewerContainerRef} className="w-full h-screen bg-black relative overflow-hidden font-sans">
      <PannellumAssets onReady={assetsReady} onError={assetsError} />
      <Tour360Styles />
      <div id="public-tour-container" ref={viewerRef} className="absolute inset-0 cursor-move" />
      <TourViewerUI
        tourConfig={tourConfig}
        introPlanetUrl={introPlanetUrl}
        currentSceneId={currentSceneId}
        started={started}
        loading={loading}
        error={viewerError}
        showTools={showTools}
        showGallery={showGallery}
        showGuide={showGuide}
        isFullscreen={isFullscreen}
        isAudioPlaying={isAudioPlaying}
        onStart={startTour}
        onRetry={() => setRetryKey((key) => key + 1)}
        onToggleAudio={toggleAudio}
        onToggleFullscreen={toggleFullscreen}
        onPrev={() => moveScene(-1)}
        onNext={() => moveScene(1)}
        onScene={changeScene}
        setShowTools={setShowTools}
        setShowGallery={setShowGallery}
        setShowGuide={setShowGuide}
      />
    </div>
  );
}
