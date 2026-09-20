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
  const viewerContainerRef = useRef<HTMLDivElement>(null); // Untuk keperluan Fullscreen
  const viewerRef = useRef<HTMLDivElement>(null);
  const viewerInstance = useRef<any>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isAudioEnabledRef = useRef<boolean>(false);
  
  // States
  const [isScriptReady, setIsScriptReady] = useState(false);
  const [tourState, setTourState] = useState<"pending" | "playing">("pending");
  const [currentSceneId, setCurrentSceneId] = useState<string>("");
  
  // UI States
  const [showTools, setShowTools] = useState(true);
  const [showGallery, setShowGallery] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // Scene List untuk Navigasi Prev/Next dan Gallery
  const sceneIds = Object.keys(tourConfig?.scenes || {});

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.loop = true; 

    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      document.removeEventListener('fullscreenchange', handleFsChange);
    };
  }, []);

  useEffect(() => {
    if (isScriptReady && viewerRef.current && window.pannellum && !viewerInstance.current) {
      const config = JSON.parse(JSON.stringify(tourConfig));

      // PENGATURAN PANNELLUM CUSTOM
      config.default.autoRotate = -2; 
      config.default.autoRotateInactivityDelay = 3000; 
      config.default.sceneFadeDuration = 1000; 
      
      // MATIKAN UI DEFAULT BAWAAN PANNELLUM
      config.default.showControls = false;
      config.default.showZoomCtrl = false;
      config.default.showFullscreenCtrl = false;

      // Custom Hotspot (Sama seperti sebelumnya)
      if (config.scenes) {
        Object.keys(config.scenes).forEach(sceneKey => {
          const scene = config.scenes[sceneKey];
          if (scene.hotSpots) {
            scene.hotSpots.forEach((hs: any) => {
              if (hs.type === "scene" && hs.sceneId) {
                const targetRoom = hs.sceneId;
                const targetRoomTitle = config.scenes[hs.sceneId]?.title || "Ke Ruangan Selanjutnya";

                hs.type = "custom";
                hs.cssClass = "pakde-hotspot-wrapper"; 
                hs.createTooltipFunc = (hotSpotDiv: HTMLElement, args: string) => {
                  const dot = document.createElement('div');
                  dot.classList.add('pakde-hotspot-dot');
                  hotSpotDiv.appendChild(dot);
                  
                  const label = document.createElement('div');
                  label.classList.add('pakde-hotspot-label');
                  label.innerHTML = args;
                  hotSpotDiv.appendChild(label);
                };
                hs.createTooltipArgs = targetRoomTitle;
                
                hs.clickHandlerFunc = () => {
                  const viewer = viewerInstance.current;
                  if (viewer) {
                    let transitionTriggered = false;
                    const eksekusiPindahRuangan = () => {
                      if (!transitionTriggered) {
                        transitionTriggered = true;
                        viewer.loadScene(targetRoom);
                      }
                    };
                    viewer.lookAt(hs.pitch, hs.yaw, 30, 800, eksekusiPindahRuangan);
                    setTimeout(eksekusiPindahRuangan, 850);
                  }
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
              audioRef.current.play().catch(e => console.log("Audio diblokir:", e));
              setIsAudioPlaying(true);
            }
          } else {
            audioRef.current.pause();
            audioRef.current.src = "";
            setIsAudioPlaying(false);
          }
        }
      });
    }

    return () => {
      if (viewerInstance.current) {
        try { viewerInstance.current.destroy(); } catch (e) {}
        viewerInstance.current = null;
      }
    };
  }, [isScriptReady, tourConfig]);

  // --- ACTIONS ---
  const handleStartTour = (withAudio: boolean) => {
    setTourState("playing");
    isAudioEnabledRef.current = withAudio;
    setIsAudioPlaying(withAudio);

    if (viewerInstance.current) {
      const currentPitch = viewerInstance.current.getPitch();
      const currentYaw = viewerInstance.current.getYaw();
      viewerInstance.current.setHfov(150);
      viewerInstance.current.lookAt(currentPitch, currentYaw, 110, 2500);
    }

    if (withAudio && viewerInstance.current && audioRef.current) {
      const currentSceneConfig = tourConfig.scenes[viewerInstance.current.getScene()];
      if (currentSceneConfig && currentSceneConfig.customAudioUrl) {
        audioRef.current.src = currentSceneConfig.customAudioUrl;
        audioRef.current.play().catch(e => {});
      }
    }
    
    // Tampilkan guide overlay sejenak saat pertama masuk
    setTimeout(() => setShowGuide(true), 1500);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      viewerContainerRef.current?.requestFullscreen().catch(err => {});
    } else {
      document.exitFullscreen();
    }
  };

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isAudioPlaying) {
        audioRef.current.pause();
        setIsAudioPlaying(false);
        isAudioEnabledRef.current = false;
      } else {
        audioRef.current.play().catch(e => {});
        setIsAudioPlaying(true);
        isAudioEnabledRef.current = true;
      }
    }
  };

  const changeScene = (id: string) => {
    if (viewerInstance.current && id !== currentSceneId) {
      viewerInstance.current.loadScene(id);
      setShowGallery(false);
    }
  };

  const goToPrevScene = () => {
    const idx = sceneIds.indexOf(currentSceneId);
    if (idx > 0) changeScene(sceneIds[idx - 1]);
    else changeScene(sceneIds[sceneIds.length - 1]); // Loop ke akhir
  };

  const goToNextScene = () => {
    const idx = sceneIds.indexOf(currentSceneId);
    if (idx < sceneIds.length - 1) changeScene(sceneIds[idx + 1]);
    else changeScene(sceneIds[0]); // Loop ke awal
  };

  return (
    <div ref={viewerContainerRef} className="w-full h-screen bg-black relative flex items-center justify-center font-sans overflow-hidden">
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css" />
      <Script src="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js" onLoad={() => setIsScriptReady(true)} />

      {/* STYLE BAWAAN PANNELLUM CUSTOM */}
      <style>{`
        .pakde-hotspot-wrapper { position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer; width: 40px; height: 40px; }
        .pakde-hotspot-dot { width: 32px; height: 32px; background-color: rgba(255, 255, 255, 0.9); border: 4px solid #D6A34A; border-radius: 50%; box-shadow: 0 4px 10px rgba(0,0,0,0.5); transition: all 0.3s ease; animation: pulse-hotspot 2s infinite; }
        .pakde-hotspot-wrapper:hover .pakde-hotspot-dot { transform: scale(1.3); background-color: #D6A34A; border-color: white; animation: none; }
        .pakde-hotspot-label { position: absolute; bottom: 45px; left: 50%; transform: translateX(-50%) translateY(10px); background: rgba(0, 0, 0, 0.8); color: #D6A34A; padding: 6px 14px; border-radius: 12px; font-size: 13px; font-weight: 700; white-space: nowrap; opacity: 0; pointer-events: none; transition: all 0.3s ease; border: 1px solid #D6A34A; }
        .pakde-hotspot-wrapper:hover .pakde-hotspot-label { opacity: 1; transform: translateX(-50%) translateY(0); }
        @keyframes pulse-hotspot { 0% { box-shadow: 0 0 0 0 rgba(214, 163, 74, 0.7); } 70% { box-shadow: 0 0 0 15px rgba(214, 163, 74, 0); } 100% { box-shadow: 0 0 0 0 rgba(214, 163, 74, 0); } }
        
        .planet-curtain { position: absolute; inset: 0; z-index: 50; background-color: #000; display: flex; align-items: center; justify-content: center; overflow: hidden; transition: opacity 2.5s ease, transform 2.5s ease; }
        .planet-curtain.hidden { opacity: 0; pointer-events: none; transform: scale(8); }
        .planet-curtain.visible { opacity: 1; transform: scale(1); }
        .planet-img { width: 100vw; height: 100vh; object-fit: cover; animation: spin-planet 120s linear infinite; }
        @keyframes spin-planet { 0% { transform: scale(1.42) rotate(0deg); } 100% { transform: scale(1.42) rotate(360deg); } }
      `}</style>

      {/* LAYER 1: Intro Planet */}
      <div className={`planet-curtain ${tourState === "pending" ? "visible" : "hidden"}`}>
        {introPlanetUrl && <img src={introPlanetUrl} alt="Intro Planet" className="planet-img" />}
      </div>

      {/* LAYER 2: Mulai Dialog */}
      {tourState === "pending" && (
        <div className="absolute inset-0 z-[60] bg-black/40 flex items-center justify-center p-6 backdrop-blur-sm transition-opacity duration-1000">
          <div className="bg-[#111]/90 backdrop-blur-md max-w-sm w-full rounded-3xl p-8 text-center border border-[#D6A34A]/30 shadow-2xl">
            <div className="w-16 h-16 bg-[#D6A34A]/20 rounded-full flex items-center justify-center text-[#D6A34A] mx-auto mb-6">
              <Sparkles size={32} />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Virtual Tour 360°</h2>
            <p className="text-gray-400 text-sm mb-8">Eksplorasi properti secara imersif. Aktifkan audio untuk pengalaman maksimal.</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => handleStartTour(true)} className="w-full flex items-center justify-center gap-2 bg-[#D6A34A] text-black font-bold py-3.5 rounded-full hover:bg-[#e8b65c] transition-all">
                <Volume2 size={20} /> Mulai Tour
              </button>
              <button onClick={() => handleStartTour(false)} className="w-full text-gray-400 font-medium py-2 hover:text-white transition-all text-sm">
                Mulai Tanpa Audio
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* LAYER 3: PANNELLUM VIEWER */}
      <div id="public-tour-container" ref={viewerRef} className="w-full h-full cursor-move z-0" />

      {/* LAYER 4: CUSTOM UI CONTROLS (Hanya tampil jika playing) */}
      {tourState === "playing" && (
        <>
          {/* Judul Ruangan Kiri Atas */}
          <div className="absolute top-6 left-6 z-20 pointer-events-none">
            <h1 className="text-white text-2xl md:text-3xl font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {tourConfig?.scenes[currentSceneId]?.title || "Memuat..."}
            </h1>
          </div>

          {/* Tombol Info (Kiri Bawah) */}
          <button 
            onClick={() => setShowGuide(true)}
            className="absolute bottom-6 left-6 z-20 w-12 h-12 rounded-full bg-black/60 hover:bg-black/90 border border-[#D6A34A]/50 text-[#D6A34A] flex items-center justify-center backdrop-blur-md transition-all shadow-lg hover:scale-110"
            title="Panduan Navigasi"
          >
            <Info size={22} />
          </button>

          {/* Tombol Audio (Kanan Bawah) */}
          <button 
            onClick={toggleAudio}
            className="absolute bottom-6 right-6 z-20 w-12 h-12 rounded-full bg-black/60 hover:bg-black/90 border border-[#D6A34A]/50 text-[#D6A34A] flex items-center justify-center backdrop-blur-md transition-all shadow-lg hover:scale-110"
            title={isAudioPlaying ? "Matikan Suara" : "Nyalakan Suara"}
          >
            {isAudioPlaying ? <Volume2 size={22} /> : <VolumeX size={22} />}
          </button>

          {/* PILL CONTROLS (Tengah Bawah) */}
          <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-20 transition-all duration-500 ease-in-out ${showTools ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'}`}>
            <div className="bg-black/80 backdrop-blur-md border border-[#D6A34A]/30 rounded-full px-4 md:px-6 py-3 flex items-center gap-4 md:gap-6 shadow-2xl">
              <button onClick={goToPrevScene} className="text-[#D6A34A] hover:text-white hover:scale-110 transition-all p-1" title="Ruangan Sebelumnya">
                <ChevronLeft size={28} />
              </button>
              
              <button onClick={() => setShowGallery(true)} className="text-[#D6A34A] hover:text-white hover:scale-110 transition-all p-1" title="Pilih Ruangan (Galeri)">
                <LayoutGrid size={24} />
              </button>

              <div className="w-px h-6 bg-[#D6A34A]/30 mx-1 md:mx-2"></div>

              <button onClick={() => setShowTools(false)} className="text-[#D6A34A] hover:text-white hover:scale-110 transition-all p-1" title="Sembunyikan Alat">
                <ChevronDown size={24} />
              </button>

              <div className="w-px h-6 bg-[#D6A34A]/30 mx-1 md:mx-2"></div>

              <button onClick={toggleFullscreen} className="text-[#D6A34A] hover:text-white hover:scale-110 transition-all p-1" title="Layar Penuh">
                {isFullscreen ? <Minimize size={22} /> : <Maximize size={22} />}
              </button>

              <button onClick={goToNextScene} className="text-[#D6A34A] hover:text-white hover:scale-110 transition-all p-1" title="Ruangan Selanjutnya">
                <ChevronRight size={28} />
              </button>
            </div>
          </div>

          {/* Tombol Munculkan Tools (Hanya tampil saat Tools disembunyikan) */}
          {!showTools && (
            <button 
              onClick={() => setShowTools(true)}
              className="absolute bottom-0 left-1/2 -translate-x-1/2 z-20 bg-black/80 text-[#D6A34A] px-6 py-1 rounded-t-xl border-t border-x border-[#D6A34A]/30 hover:bg-black transition-all shadow-[0_-4px_10px_rgba(0,0,0,0.5)]"
              title="Tampilkan Alat"
            >
              <ChevronUp size={24} />
            </button>
          )}

          {/* OVERLAY: GALLERY THUMBNAILS */}
          {showGallery && (
            <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
              <button onClick={() => setShowGallery(false)} className="absolute top-6 right-6 text-white hover:text-[#D6A34A] transition-colors p-2 bg-white/10 rounded-full">
                <X size={32} />
              </button>
              
              <h3 className="text-white text-2xl font-bold mb-8 text-[#D6A34A]">Pilih Ruangan</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 max-w-5xl w-full overflow-y-auto max-h-[70vh] p-2">
                {sceneIds.map((id) => {
                  const s = tourConfig.scenes[id];
                  const isActive = id === currentSceneId;
                  return (
                    <button 
                      key={id} 
                      onClick={() => changeScene(id)}
                      className={`relative group rounded-xl overflow-hidden aspect-video border-2 transition-all ${isActive ? 'border-[#D6A34A] scale-105 shadow-[0_0_15px_rgba(214,163,74,0.5)]' : 'border-transparent hover:border-white/50'}`}
                    >
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

          {/* OVERLAY: USER GUIDE */}
          {showGuide && (
            <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300" onClick={() => setShowGuide(false)}>
              <div className="bg-[#111]/95 border border-[#D6A34A]/30 rounded-3xl p-8 max-w-2xl w-full text-center relative" onClick={e => e.stopPropagation()}>
                <button onClick={() => setShowGuide(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                  <X size={24} />
                </button>
                
                <h3 className="text-2xl font-bold text-white mb-8">Panduan Navigasi <span className="text-[#D6A34A]">360°</span></h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="flex flex-col items-center text-gray-300">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-[#D6A34A]">
                      <MousePointer2 size={32} />
                    </div>
                    <p className="font-bold text-white mb-1">Klik & Geser</p>
                    <p className="text-xs">Tahan klik kiri dan geser mouse untuk melihat sekeliling.</p>
                  </div>
                  
                  <div className="flex flex-col items-center text-gray-300">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-[#D6A34A]">
                      <Move size={32} />
                    </div>
                    <p className="font-bold text-white mb-1">Sentuh Layar</p>
                    <p className="text-xs">Geser layar menggunakan jari pada perangkat smartphone.</p>
                  </div>
                  
                  <div className="flex flex-col items-center text-gray-300">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-[#D6A34A]">
                      <ZoomIn size={32} />
                    </div>
                    <p className="font-bold text-white mb-1">Scroll / Cubit</p>
                    <p className="text-xs">Gunakan scroll mouse atau cubit layar untuk Zoom In/Out.</p>
                  </div>
                </div>

                <button onClick={() => setShowGuide(false)} className="mt-10 px-8 py-3 bg-[#D6A34A] text-black font-bold rounded-full hover:bg-[#e8b65c] transition-colors">
                  Mengerti
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}