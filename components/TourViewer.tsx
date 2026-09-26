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
  exitUrl?: string;
  propertyTitle?: string;
};

export default function TourViewer({ tourConfig, introPlanetUrl, exitUrl = "/", propertyTitle }: Props) {
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const viewerInstance = useRef<PannellumViewer | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioEnabledRef = useRef(false);
  const startedRef = useRef(false);
  const rotateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sceneIds = useMemo(() => Object.keys(tourConfig?.scenes || {}), [tourConfig?.scenes]);
  const firstScene = tourConfig?.default?.firstScene || sceneIds[0] || "";
  const currentSceneIdRef = useRef(firstScene);

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

  const pannellumScenes = useMemo(
    () => Object.fromEntries(sceneIds.map((id) => {
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

      return [id, {
        type: scene.type || "equirectangular",
        panorama: scene.panorama,
        preview: scene.preview,
        pitch: Number(scene.pitch ?? 0),
        yaw: Number(scene.yaw ?? 0),
        hfov: Number(scene.hfov ?? 120),
        minHfov: Number(scene.minHfov ?? 55),
        maxHfov: Number(scene.maxHfov ?? 140),
        autoRotate: Number(scene.autoRotate ?? tourConfig.default?.autoRotate ?? -0.35),
        autoRotateInactivityDelay: Number(scene.autoRotateInactivityDelay ?? tourConfig.default?.autoRotateInactivityDelay ?? 4000),
        hotSpots,
      }];
    })),
    [sceneIds, tourConfig.default?.autoRotate, tourConfig.default?.autoRotateInactivityDelay, tourConfig.scenes]
  );

  const playSceneAudio = useCallback((sceneId: string) => {
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
    audio.play().then(() => setIsAudioPlaying(true)).catch(() => setIsAudioPlaying(false));
  }, [tourConfig.scenes]);

  const scheduleAutoRotate = useCallback((delay = 4000) => {
    if (rotateTimerRef.current) clearTimeout(rotateTimerRef.current);
    viewerInstance.current?.stopAutoRotate?.();
    if (!startedRef.current) return;

    rotateTimerRef.current = setTimeout(() => {
      const scene = tourConfig.scenes[currentSceneIdRef.current];
      const speed = Number(scene?.autoRotate ?? tourConfig.default?.autoRotate ?? -0.35);
      viewerInstance.current?.startAutoRotate?.(speed);
    }, delay);
  }, [tourConfig.default?.autoRotate, tourConfig.scenes]);

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
      if (rotateTimerRef.current) clearTimeout(rotateTimerRef.current);
      document.removeEventListener("fullscreenchange", onFullscreen);
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!engineReady || !viewerRef.current || !window.pannellum?.viewer || !firstScene) return;
    setLoading(true);
    setViewerError("");
    try { viewerInstance.current?.destroy(); } catch {}
    viewerInstance.current = null;
    currentSceneIdRef.current = firstScene;
    setCurrentSceneId(firstScene);

    let viewer: PannellumViewer | null = null;
    let observer: ResizeObserver | null = null;
    const node = viewerRef.current;
    const markInteraction = () => scheduleAutoRotate(4000);

    try {
      viewer = window.pannellum.viewer(node, {
        default: {
          firstScene,
          autoLoad: true,
          sceneFadeDuration: Number(tourConfig.default?.sceneFadeDuration ?? 700),
          showControls: false,
          crossOrigin: "anonymous",
          escapeHTML: true,
          backgroundColor: [0, 0, 0],
          autoRotate: Number(tourConfig.default?.autoRotate ?? -0.35),
          autoRotateInactivityDelay: Number(tourConfig.default?.autoRotateInactivityDelay ?? 4000),
        },
        scenes: pannellumScenes,
      });

      viewerInstance.current = viewer;
      viewer.stopAutoRotate?.();
      viewer.on("load", () => {
        setLoading(false);
        setViewerError("");
        viewer?.resize();
        scheduleAutoRotate(1200);
      });
      viewer.on("scenechange", (sceneId: string) => {
        currentSceneIdRef.current = sceneId;
        setCurrentSceneId(sceneId);
        setLoading(true);
        setShowGallery(false);
        viewer?.stopAutoRotate?.();
        if (audioEnabledRef.current) playSceneAudio(sceneId);
      });
      viewer.on("error", (message: unknown) => {
        setLoading(false);
        setViewerError(errorMessage(message, "Panorama gagal dimuat dari R2."));
      });

      node.addEventListener("pointerdown", markInteraction, { passive: true });
      node.addEventListener("pointermove", markInteraction, { passive: true });
      node.addEventListener("touchstart", markInteraction, { passive: true });
      node.addEventListener("wheel", markInteraction, { passive: true });

      if (typeof ResizeObserver !== "undefined") {
        observer = new ResizeObserver(() => viewer?.resize());
        observer.observe(node);
      }
    } catch (error) {
      setLoading(false);
      setViewerError(errorMessage(error));
    }

    return () => {
      observer?.disconnect();
      node.removeEventListener("pointerdown", markInteraction);
      node.removeEventListener("pointermove", markInteraction);
      node.removeEventListener("touchstart", markInteraction);
      node.removeEventListener("wheel", markInteraction);
      if (rotateTimerRef.current) clearTimeout(rotateTimerRef.current);
      try { viewer?.destroy(); } catch {}
      if (viewerInstance.current === viewer) viewerInstance.current = null;
    };
  }, [engineReady, firstScene, pannellumScenes, playSceneAudio, retryKey, scheduleAutoRotate, tourConfig.default?.autoRotate, tourConfig.default?.autoRotateInactivityDelay, tourConfig.default?.sceneFadeDuration]);

  const startTour = (withAudio: boolean) => {
    startedRef.current = true;
    setStarted(true);
    setShowGuide(true);
    audioEnabledRef.current = withAudio;
    if (withAudio) playSceneAudio(currentSceneIdRef.current);
    else {
      audioRef.current?.pause();
      setIsAudioPlaying(false);
    }
    const viewer = viewerInstance.current;
    if (viewer && viewer.getHfov() < 110) viewer.setHfov(120, 700);
    scheduleAutoRotate(900);
  };

  const toggleAudio = () => {
    if (audioEnabledRef.current && isAudioPlaying) {
      audioEnabledRef.current = false;
      audioRef.current?.pause();
      setIsAudioPlaying(false);
    } else {
      audioEnabledRef.current = true;
      playSceneAudio(currentSceneIdRef.current);
    }
  };

  const changeScene = (id: string) => {
    if (!tourConfig.scenes[id]) return;
    if (id === currentSceneIdRef.current) { setShowGallery(false); return; }
    setLoading(true);
    viewerInstance.current?.loadScene(id);
  };

  const moveScene = (direction: -1 | 1) => {
    if (sceneIds.length < 2) return;
    const index = Math.max(0, sceneIds.indexOf(currentSceneIdRef.current));
    changeScene(sceneIds[(index + direction + sceneIds.length) % sceneIds.length]);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) viewerContainerRef.current?.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  };

  const assetsReady = useCallback(() => setEngineReady(true), []);
  const assetsError = useCallback((message: string) => { setLoading(false); setViewerError(message); }, []);

  if (!firstScene) return <div className="w-full h-screen bg-black text-white flex items-center justify-center">Virtual Tour belum tersedia.</div>;

  return (
    <div ref={viewerContainerRef} className="w-full h-[100dvh] bg-black relative overflow-hidden font-sans">
      <PannellumAssets onReady={assetsReady} onError={assetsError} />
      <Tour360Styles />
      <div id="public-tour-container" ref={viewerRef} className="absolute inset-0 cursor-move" />
      <TourViewerUI
        tourConfig={tourConfig} introPlanetUrl={introPlanetUrl} exitUrl={exitUrl} propertyTitle={propertyTitle}
        currentSceneId={currentSceneId} started={started} loading={loading} error={viewerError}
        showTools={showTools} showGallery={showGallery} showGuide={showGuide}
        isFullscreen={isFullscreen} isAudioPlaying={isAudioPlaying}
        onStart={startTour} onRetry={() => setRetryKey((key) => key + 1)} onToggleAudio={toggleAudio}
        onToggleFullscreen={toggleFullscreen} onPrev={() => moveScene(-1)} onNext={() => moveScene(1)} onScene={changeScene}
        setShowTools={setShowTools} setShowGallery={setShowGallery} setShowGuide={setShowGuide}
      />
    </div>
  );
}
