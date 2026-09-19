"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { Volume2, VolumeX, Sparkles } from "lucide-react";

declare global {
  interface Window {
    pannellum: any;
  }
}

export default function TourViewer({ tourConfig, introPlanetUrl }: { tourConfig: any, introPlanetUrl?: string }) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const viewerInstance = useRef<any>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isAudioEnabledRef = useRef<boolean>(false);
  
  const [isScriptReady, setIsScriptReady] = useState(false);
  const [tourState, setTourState] = useState<"pending" | "playing">("pending");

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.loop = true; 

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  useEffect(() => {
    if (isScriptReady && viewerRef.current && window.pannellum && !viewerInstance.current) {
      
      const config = JSON.parse(JSON.stringify(tourConfig));

      // Pengaturan Global Pannellum
      config.default.autoRotate = -2; 
      config.default.autoRotateInactivityDelay = 3000; 
      config.default.sceneFadeDuration = 1000; // Efek Fade transisi antar ruangan

      if (config.scenes) {
        Object.keys(config.scenes).forEach(sceneKey => {
          const scene = config.scenes[sceneKey];
          if (scene.hotSpots) {
            scene.hotSpots.forEach((hs: any) => {
              if (hs.type === "scene" && hs.sceneId) {
                const targetRoom = hs.sceneId;
                const targetRoomTitle = config.scenes[hs.sceneId]?.title || "Ke Ruangan Selanjutnya";

                // Ubah menjadi custom hotspot agar bisa pakai desain kita sendiri + Tooltip
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
                    // Zoom in perlahan ke arah pintu/hotspot sebelum pindah
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

      viewerInstance.current.on('scenechange', (sceneId: string) => {
        if (isAudioEnabledRef.current && audioRef.current) {
          const newSceneConfig = config.scenes[sceneId];
          
          if (newSceneConfig && newSceneConfig.customAudioUrl) {
            if (!audioRef.current.src.includes(newSceneConfig.customAudioUrl)) {
              audioRef.current.src = newSceneConfig.customAudioUrl;
              audioRef.current.play().catch(e => console.log("Auto-play audio dicekal:", e));
            }
          } else {
            audioRef.current.pause();
            audioRef.current.src = "";
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

  const handleStartTour = (withAudio: boolean) => {
    setTourState("playing");
    isAudioEnabledRef.current = withAudio;

    if (viewerInstance.current) {
      const currentPitch = viewerInstance.current.getPitch();
      const currentYaw = viewerInstance.current.getYaw();
      
      // Set lensa sangat lebar
      viewerInstance.current.setHfov(150);
      
      // Terbang perlahan ke FOV normal
      viewerInstance.current.lookAt(currentPitch, currentYaw, 110, 2500);
    }

    if (withAudio && viewerInstance.current && audioRef.current) {
      const currentSceneId = viewerInstance.current.getScene();
      const currentSceneConfig = tourConfig.scenes[currentSceneId];
      
      if (currentSceneConfig && currentSceneConfig.customAudioUrl) {
        audioRef.current.src = currentSceneConfig.customAudioUrl;
        audioRef.current.play().catch(e => console.log("Auto-play dicekal:", e));
      }
    }
  };

  return (
    <div className="w-full h-screen bg-black relative flex items-center justify-center font-sans overflow-hidden">
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css" />
      
      <style>{`
        /* --- DESAIN HOTSPOT PREMIUM --- */
        .pakde-hotspot-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          width: 40px; height: 40px;
        }
        .pakde-hotspot-dot {
          width: 32px; height: 32px;
          background-color: rgba(255, 255, 255, 0.9);
          border: 4px solid #D6A34A; border-radius: 50%;
          box-shadow: 0 4px 10px rgba(0,0,0,0.5);
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
          animation: pulse-hotspot 2s infinite;
        }
        .pakde-hotspot-wrapper:hover .pakde-hotspot-dot {
          transform: scale(1.3); background-color: #D6A34A; border-color: white;
          animation: none;
        }
        
        /* Label Tooltip melayang */
        .pakde-hotspot-label {
          position: absolute;
          bottom: 45px;
          left: 50%;
          transform: translateX(-50%) translateY(10px);
          background: rgba(74, 47, 27, 0.95);
          color: white;
          padding: 6px 14px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          border: 1px solid rgba(214, 163, 74, 0.3);
        }
        .pakde-hotspot-wrapper:hover .pakde-hotspot-label {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }

        @keyframes pulse-hotspot {
          0% { box-shadow: 0 0 0 0 rgba(214, 163, 74, 0.7); }
          70% { box-shadow: 0 0 0 15px rgba(214, 163, 74, 0); }
          100% { box-shadow: 0 0 0 0 rgba(214, 163, 74, 0); }
        }
        
        /* --- TIRAI LITTLE PLANET --- */
        .planet-curtain {
          position: absolute; inset: 0; z-index: 50; 
          background-color: #000; display: flex; align-items: center; justify-content: center; overflow: hidden;
          transition: opacity 2.5s cubic-bezier(0.25, 1, 0.5, 1), transform 2.5s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .planet-curtain.hidden { opacity: 0; pointer-events: none; transform: scale(8); }
        .planet-curtain.visible { opacity: 1; transform: scale(1); }
        .planet-img { width: 100vw; height: 100vh; object-fit: cover; animation: spin-planet 120s linear infinite; }
        @keyframes spin-planet {
          0% { transform: scale(1.42) rotate(0deg); }
          100% { transform: scale(1.42) rotate(360deg); }
        }
      `}</style>

      <Script 
        src="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js"
        onLoad={() => setIsScriptReady(true)}
      />

      <div className={`planet-curtain ${tourState === "pending" ? "visible" : "hidden"}`}>
        {introPlanetUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={introPlanetUrl} alt="Intro Planet" className="planet-img" />
        )}
      </div>

      {tourState === "pending" && (
        <div className="absolute inset-0 z-[60] bg-black/20 flex items-center justify-center p-6 transition-opacity duration-1000">
          <div className="bg-[#FFF7E8]/95 backdrop-blur-md max-w-md w-full rounded-3xl p-8 text-center border border-[#D6A34A]/30 shadow-2xl">
            <div className="w-16 h-16 bg-[#4A2F1B] rounded-2xl flex items-center justify-center text-[#D6A34A] mx-auto mb-6 shadow-lg">
              <Sparkles size={32} />
            </div>
            <h2 className="text-2xl font-black text-[#4A2F1B] mb-2">Mulai Virtual Tour</h2>
            <p className="text-[#281C15]/70 text-sm mb-8">
              Aktifkan panduan suara untuk pengalaman simulasi survei yang lebih nyata dan interaktif.
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={() => handleStartTour(true)} className="w-full flex items-center justify-center gap-2 bg-[#D6A34A] text-[#281C15] font-bold py-3.5 px-4 rounded-xl hover:bg-[#c2913b] transition-all shadow-md">
                <Volume2 size={20} /> Mulai (Dengan Audio)
              </button>
              <button onClick={() => handleStartTour(false)} className="w-full flex items-center justify-center gap-2 bg-transparent text-[#4A2F1B] font-bold py-3.5 px-4 rounded-xl border border-[#4A2F1B]/30 hover:bg-[#4A2F1B]/10 transition-all">
                <VolumeX size={20} /> Mulai (Tanpa Audio)
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div id="public-tour-container" ref={viewerRef} className="w-full h-full cursor-move z-0" />
    </div>
  );
}