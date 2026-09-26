"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { 
  Volume2, VolumeX, Sparkles, Info, LayoutGrid, 
  ChevronDown, ChevronUp, Maximize, Minimize, 
  ChevronLeft, ChevronRight, X, MousePointer2, Move, ZoomIn 
} from "lucide-react";

declare global {
  interface Window {
    pannellum: any;
  }
}

export default function TourViewer({ tourConfig, introPlanetUrl }: { tourConfig: any, introPlanetUrl?: string }) {
  const viewerContainerRef = useRef<HTMLDivElement>(null); 
  const viewerRef = useRef<HTMLDivElement>(null);
  const viewerInstance = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isAudioEnabledRef = useRef<boolean>(false);
  
  const [isScriptReady, setIsScriptReady] = useState(false);
  const [tourState, setTourState] = useState<"pending" | "playing">("pending");
  const [currentSceneId, setCurrentSceneId] = useState<string>("");
  const [showTools, setShowTools] = useState(true);
  const [showGallery, setShowGallery] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const sceneIds = Object.keys(tourConfig?.scenes || {});

  const renderViewerHotspot = (hotSpotDiv: HTMLElement, args: any) => {
    const { name, iconType, targetImage } = args;
    hotSpotDiv.innerHTML = '';
    hotSpotDiv.classList.add('pakde-hotspot-wrapper', 'pointer-events-auto', 'cursor-pointer');

    const dot = document.createElement('div');
    if (iconType === 'thumbnail' && targetImage) {
      dot.classList.add('pakde-hotspot-thumbnail');
      dot.style.backgroundImage = `url(${targetImage})`;
    } else {
      dot.classList.add('pakde-hotspot-dot', 'pakde-door-hotspot');
      const iconSpan = document.createElement('span');
      iconSpan.classList.add('door-icon');
      if (iconType === 'arrow') {
        iconSpan.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>`;
      } else {
        iconSpan.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M18 3a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12z"></path><path d="M10 9v6"></path><path d="M14 9v6"></path></svg>`;
      }
      dot.appendChild(iconSpan);
    }
    hotSpotDiv.appendChild(dot);
    
    const label = document.createElement('div');
    label.classList.add('door-label');
    label.innerHTML = name;
    hotSpotDiv.appendChild(label);
  };

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.loop = true; 
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
      document.removeEventListener('fullscreenchange', handleFsChange);
    };
  }, []);

  useEffect(() => {
    if (isScriptReady && viewerRef.current && window.pannellum && !viewerInstance.current) {
      const config = JSON.parse(JSON.stringify(tourConfig));
      config.default.autoRotate = 0; 
      config.default.hfov = 90;
      config.default.sceneFadeDuration = 1000; 
      config.default.showControls = false;
      config.default.showZoomCtrl = false;
      config.default.showFullscreenCtrl = false;
      config.default.title = ""; 
      
      // === FIX LAYAR HITAM LOADING TERUS ===
      // Menginstruksikan Pannellum untuk tidak menghitung ukuran file terlebih dahulu
      config.default.dynamic = true;

      if (config.scenes) {
        Object.keys(config.scenes).forEach(sceneKey => {
          const scene = config.scenes[sceneKey];
          scene.title = ""; 
          scene.minHfov = 50;
          scene.maxHfov = 110; 

          if (scene.hotSpots) {
            scene.hotSpots.forEach((hs: any) => {
              if (hs.type === "scene" && hs.sceneId) {
                const targetRoom = hs.sceneId;
                const rawLabel = hs.text || "";
                const parts = rawLabel.split("|||");
                const displayName = parts[0] || tourConfig.scenes[hs.sceneId]?.title || "Pindah Ruangan";
                const iconType = parts[1] || "door";
                const targetImage = tourConfig.scenes[hs.sceneId]?.panorama || "";

                hs.type = "custom";
                hs.createTooltipFunc = renderViewerHotspot;
                hs.createTooltipArgs = { name: displayName, iconType, targetImage };
                
                hs.clickHandlerFunc = () => {
                  const viewer = viewerInstance.current;
                  if (viewer) viewer.loadScene(targetRoom);
                };
              }
            });
          }
        });
      }
      viewerInstance.current = window.pannellum.viewer(viewerRef.current.id, config);
      setCurrentSceneId(viewerInstance.current.getScene());
      viewerInstance.current.on('scenechange', (sceneId: string) => {
        setCurrentSceneId(sceneId);
        if (isAudioEnabledRef.current && audioRef.current) {
          const newSceneConfig = config.scenes[sceneId];
          if (newSceneConfig && newSceneConfig.customAudioUrl) {
            if (!audioRef.current.src.includes(newSceneConfig.customAudioUrl)) {
              audioRef.current.src = newSceneConfig.customAudioUrl;
              audioRef.current.play().catch(e => {});
              setIsAudioPlaying(true);
            }
          } else {
            audioRef.current.pause(); audioRef.current.src = ""; setIsAudioPlaying(false);
          }
        }
      });
    }
    return () => {
      if (viewerInstance.current) { try { viewerInstance.current.destroy(); } catch (e) {} viewerInstance.current = null; }
    };
  }, [isScriptReady, tourConfig]);

  const handleStartTour = (withAudio: boolean) => {
    setTourState("playing");
    isAudioEnabledRef.current = withAudio;
    setIsAudioPlaying(withAudio);
    if (viewerInstance.current) {
      viewerInstance.current.setHfov(130);
      viewerInstance.current.lookAt(viewerInstance.current.getPitch(), viewerInstance.current.getYaw(), 90, 2000);
    }
    if (withAudio && viewerInstance.current && audioRef.current) {
      const currentSceneConfig = tourConfig.scenes[viewerInstance.current.getScene()];
      if (currentSceneConfig && currentSceneConfig.customAudioUrl) {
        audioRef.current.src = currentSceneConfig.customAudioUrl;
        audioRef.current.play().catch(e => {});
      }
    }
    setTimeout(() => setShowGuide(true), 1500);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) { viewerContainerRef.current?.requestFullscreen().catch(err => {}); } 
    else { document.exitFullscreen(); }
  };

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isAudioPlaying) { audioRef.current.pause(); setIsAudioPlaying(false); isAudioEnabledRef.current = false; } 
      else { audioRef.current.play().catch(e => {}); setIsAudioPlaying(true); isAudioEnabledRef.current = true; }
    }
  };

  const changeScene = (id: string) => {
    if (viewerInstance.current && id !== currentSceneId) { viewerInstance.current.loadScene(id); setShowGallery(false); }
  };
  const goToPrevScene = () => {
    const idx = sceneIds.indexOf(currentSceneId);
    if (idx > 0) changeScene(sceneIds[idx - 1]); else changeScene(sceneIds[sceneIds.length - 1]);
  };
  const goToNextScene = () => {
    const idx = sceneIds.indexOf(currentSceneId);
    if (idx < sceneIds.length - 1) changeScene(sceneIds[idx + 1]); else changeScene(sceneIds[0]);
  };

  return (
    <div ref={viewerContainerRef} className="w-full h-screen bg-black relative flex items-center justify-center font-sans overflow-hidden">
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css" />
      <Script src="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js" onLoad={() => setIsScriptReady(true)} />

      <style>{`
        .pakde-hotspot-wrapper { position: absolute; z-index: 20; display: flex; align-items: center; justify-content: center; width: 50px; height: 50px; margin-left: -25px; margin-top: -25px;}
        .pakde-hotspot-dot { width: 44px; height: 44px; border-radius: 50%; border: 3px solid rgba(255,255,255,0.8); background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 10px rgba(0,0,0,0.5); transition: all 0.3s ease;}
        .pakde-door-hotspot { animation: float-pulse 3s infinite ease-in-out; }
        .pakde-door-hotspot:hover { transform: scale(1.15); background: rgba(214, 163, 74, 0.8); border-color: #D6A34A; animation: none; }
        .pakde-hotspot-thumbnail { width: 60px; height: 60px; border-radius: 50%; border: 3px solid rgba(255,255,255,0.9); background-size: cover; background-position: center; box-shadow: 0 4px 15px rgba(0,0,0,0.6); transition: all 0.3s ease; margin-left: -5px; margin-top: -5px;}
        .pakde-hotspot-thumbnail:hover { transform: scale(1.15); border-color: #D6A34A; }
        .door-icon { display: flex; align-items: center; justify-content: center; }
        
        /* Default: Hilang dan muncul saat hover */
        .door-label { position: absolute; bottom: 100%; margin-bottom: 10px; left: 50%; transform: translateX(-50%) translateY(10px); background: rgba(0, 0, 0, 0.8); color: white; padding: 6px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; white-space: nowrap; opacity: 0; pointer-events: none; transition: all 0.3s ease; border: 1px solid rgba(255,255,255,0.2); }
        .pakde-hotspot-wrapper:hover .door-label { opacity: 1; transform: translateX(-50%) translateY(0); }
        
        /* Mobile Override: Selalu Muncul */
        @media (max-width: 768px) {
          .door-label { opacity: 1 !important; transform: translateX(-50%) translateY(0) !important; font-size: 11px; padding: 4px 10px; margin-bottom: 5px;}
        }

        @keyframes float-pulse { 0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); transform: translateY(0px); } 50% { box-shadow: 0 0 0 10px rgba(255, 255, 255, 0); transform: translateY(-5px); } 100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); transform: translateY(0px); } }
        .planet-curtain { position: absolute; inset: 0; z-index: 50; background-color: #000; display: flex; align-items: center; justify-content: center; overflow: hidden; transition: opacity 2.5s ease, visibility 2.5s ease; pointer-events: none;}
        .planet-curtain.hidden { opacity: 0; visibility: hidden;}
        .planet-curtain.visible { opacity: 1; visibility: visible;}
        .planet-img { width: 100vw; height: 100vh; object-fit: cover; animation: spin-planet 120s linear infinite; }
        @keyframes spin-planet { 0% { transform: scale(1.42) rotate(0deg); } 100% { transform: scale(1.42) rotate(360deg); } }
      `}</style>

      <div className={`planet-curtain ${tourState === "pending" ? "visible" : "hidden"}`}>
        {introPlanetUrl && <img src={introPlanetUrl} alt="Intro Planet" className="planet-img" />}
      </div>

      {tourState === "pending" && (
        <div className="absolute inset-0 z-[60] bg-black/40 flex items-center justify-center p-6 backdrop-blur-sm pointer-events-auto">
          <div className="bg-[#111]/90 backdrop-blur-md max-w-sm w-full rounded-3xl p-8 text-center border border-[#D6A34A]/30 shadow-2xl relative z-[70]">
            <div className="w-16 h-16 bg-[#D6A34A]/20 rounded-full flex items-center justify-center text-[#D6A34A] mx-auto mb-6"><Sparkles size={32} /></div>
            <h2 className="text-2xl font-black text-white mb-2">Virtual Tour 360°</h2>
            <p className="text-gray-400 text-sm mb-8">Eksplorasi properti secara imersif. Aktifkan audio untuk pengalaman maksimal.</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => handleStartTour(true)} className="w-full flex items-center justify-center gap-2 bg-[#D6A34A] text-black font-bold py-3.5 rounded-full hover:bg-[#e8b65c] transition-all cursor-pointer"><Volume2 size={20} /> Mulai Tour</button>
              <button onClick={() => handleStartTour(false)} className="w-full text-gray-400 font-medium py-2 hover:text-white transition-all text-sm cursor-pointer">Mulai Tanpa Audio</button>
            </div>
          </div>
        </div>
      )}
      
      <div id="public-tour-container" ref={viewerRef} className="w-full h-full cursor-move z-0" />

      {tourState === "playing" && (
        <>
          <div className="absolute top-6 left-6 z-20 pointer-events-none">
            <h1 className="text-white text-2xl md:text-3xl font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {tourConfig?.scenes[currentSceneId]?.title || "Memuat..."}
            </h1>
          </div>
          <button onClick={() => setShowGuide(true)} className="absolute bottom-6 left-6 z-20 w-12 h-12 rounded-full bg-black/60 hover:bg-black/90 border border-[#D6A34A]/50 text-[#D6A34A] flex items-center justify-center backdrop-blur-md transition-all shadow-lg hover:scale-110 cursor-pointer" title="Panduan Navigasi"><Info size={22} /></button>
          <button onClick={toggleAudio} className="absolute bottom-6 right-6 z-20 w-12 h-12 rounded-full bg-black/60 hover:bg-black/90 border border-[#D6A34A]/50 text-[#D6A34A] flex items-center justify-center backdrop-blur-md transition-all shadow-lg hover:scale-110 cursor-pointer" title={isAudioPlaying ? "Matikan Suara" : "Nyalakan Suara"}>{isAudioPlaying ? <Volume2 size={22} /> : <VolumeX size={22} />}</button>

          <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-20 transition-all duration-500 ease-in-out ${showTools ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'}`}>
            <div className="bg-black/80 backdrop-blur-md border border-[#D6A34A]/30 rounded-full px-4 md:px-6 py-3 flex items-center gap-4 md:gap-6 shadow-2xl">
              <button onClick={goToPrevScene} className="text-[#D6A34A] hover:text-white hover:scale-110 transition-all p-1 cursor-pointer"><ChevronLeft size={28} /></button>
              <button onClick={() => setShowGallery(true)} className="text-[#D6A34A] hover:text-white hover:scale-110 transition-all p-1 cursor-pointer"><LayoutGrid size={24} /></button>
              <div className="w-px h-6 bg-[#D6A34A]/30 mx-1 md:mx-2"></div>
              <button onClick={() => setShowTools(false)} className="text-[#D6A34A] hover:text-white hover:scale-110 transition-all p-1 cursor-pointer"><ChevronDown size={24} /></button>
              <div className="w-px h-6 bg-[#D6A34A]/30 mx-1 md:mx-2"></div>
              <button onClick={toggleFullscreen} className="text-[#D6A34A] hover:text-white hover:scale-110 transition-all p-1 cursor-pointer">{isFullscreen ? <Minimize size={22} /> : <Maximize size={22} />}</button>
              <button onClick={goToNextScene} className="text-[#D6A34A] hover:text-white hover:scale-110 transition-all p-1 cursor-pointer"><ChevronRight size={28} /></button>
            </div>
          </div>

          {!showTools && (
            <button onClick={() => setShowTools(true)} className="absolute bottom-0 left-1/2 -translate-x-1/2 z-20 bg-black/80 text-[#D6A34A] px-6 py-1 rounded-t-xl border-t border-x border-[#D6A34A]/30 hover:bg-black transition-all shadow-[0_-4px_10px_rgba(0,0,0,0.5)] cursor-pointer"><ChevronUp size={24} /></button>
          )}

          {showGallery && (
            <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
              <button onClick={() => setShowGallery(false)} className="absolute top-6 right-6 text-white hover:text-[#D6A34A] transition-colors p-2 bg-white/10 rounded-full cursor-pointer"><X size={32} /></button>
              <h3 className="text-white text-2xl font-bold mb-8 text-[#D6A34A]">Pilih Ruangan</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 max-w-5xl w-full overflow-y-auto max-h-[70vh] p-2">
                {sceneIds.map((id) => {
                  const s = tourConfig.scenes[id];
                  const isActive = id === currentSceneId;
                  return (
                    <button key={id} onClick={() => changeScene(id)} className={`relative group rounded-xl overflow-hidden aspect-video border-2 transition-all cursor-pointer ${isActive ? 'border-[#D6A34A] scale-105 shadow-[0_0_15px_rgba(214,163,74,0.5)]' : 'border-transparent hover:border-white/50'}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.panorama} alt={s.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3 pt-8">
                        <p className={`text-sm font-bold truncate ${isActive ? 'text-[#D6A34A]' : 'text-white'}`}>{s.title}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {showGuide && (
            <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300" onClick={() => setShowGuide(false)}>
              <div className="bg-[#111]/95 border border-[#D6A34A]/30 rounded-3xl p-8 max-w-2xl w-full text-center relative" onClick={e => e.stopPropagation()}>
                <button onClick={() => setShowGuide(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer"><X size={24} /></button>
                <h3 className="text-2xl font-bold text-white mb-8">Panduan Navigasi <span className="text-[#D6A34A]">360°</span></h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="flex flex-col items-center text-gray-300">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-[#D6A34A]"><MousePointer2 size={32} /></div>
                    <p className="font-bold text-white mb-1">Klik & Geser</p>
                    <p className="text-xs">Tahan klik kiri dan geser mouse untuk melihat sekeliling.</p>
                  </div>
                  <div className="flex flex-col items-center text-gray-300">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-[#D6A34A]"><Move size={32} /></div>
                    <p className="font-bold text-white mb-1">Sentuh Layar</p>
                    <p className="text-xs">Geser layar menggunakan jari pada perangkat smartphone.</p>
                  </div>
                  <div className="flex flex-col items-center text-gray-300">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-[#D6A34A]"><ZoomIn size={32} /></div>
                    <p className="font-bold text-white mb-1">Scroll / Cubit</p>
                    <p className="text-xs">Gunakan scroll mouse atau cubit layar untuk Zoom In/Out.</p>
                  </div>
                </div>
                <button onClick={() => setShowGuide(false)} className="mt-10 px-8 py-3 bg-[#D6A34A] text-black font-bold rounded-full hover:bg-[#e8b65c] transition-colors cursor-pointer">Mengerti</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}