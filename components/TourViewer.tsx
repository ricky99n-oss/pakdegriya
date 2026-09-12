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

      config.default.autoRotate = -2; 
      config.default.autoRotateInactivityDelay = 3000; 

      if (config.scenes) {
        Object.keys(config.scenes).forEach(sceneKey => {
          const scene = config.scenes[sceneKey];
          if (scene.hotSpots) {
            scene.hotSpots.forEach((hs: any) => {
              if (hs.type === "scene" && hs.sceneId) {
                const targetRoom = hs.sceneId;
                hs.type = "custom";
                hs.cssClass = "pakde-hotspot"; 
                
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

    // --- ANIMASI SEAMLESS GOOGLE EARTH ZOOM ---
    if (viewerInstance.current) {
      const currentPitch = viewerInstance.current.getPitch();
      const currentYaw = viewerInstance.current.getYaw();
      
      // Set lensa menjadi sangat lebar (seolah-olah sedang di udara)
      viewerInstance.current.setHfov(150);
      
      // Terbang perlahan ke sudut pandang normal (110) selama 2.5 detik
      viewerInstance.current.lookAt(currentPitch, currentYaw, 110, 2500);
    }

    // --- AUDIO ---
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
        .pakde-hotspot {
          width: 32px; height: 32px;
          background-color: rgba(255, 255, 255, 0.9);
          border: 4px solid #D6A34A; border-radius: 50%;
          cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.5);
          transition: all 0.3s ease; animation: pulse-hotspot 2s infinite;
        }
        .pakde-hotspot:hover { transform: scale(1.2); background-color: #D6A34A; border-color: white; }
        @keyframes pulse-hotspot {
          0% { box-shadow: 0 0 0 0 rgba(214, 163, 74, 0.7); }
          70% { box-shadow: 0 0 0 15px rgba(214, 163, 74, 0); }
          100% { box-shadow: 0 0 0 0 rgba(214, 163, 74, 0); }
        }
        
        /* --- TIRAI LITTLE PLANET (SEAMLESS ZOOM) --- */
        .planet-curtain {
          position: absolute;
          inset: 0;
          z-index: 50; 
          background-color: #000; /* Hitam pekat agar fasad tidak bocor */
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          /* Transisi 2.5 detik menggunakan Cubic Bezier agar tarikannya terasa nyata */
          transition: opacity 2.5s cubic-bezier(0.25, 1, 0.5, 1), transform 2.5s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .planet-curtain.hidden {
          opacity: 0;
          pointer-events: none;
          transform: scale(8); /* Efek Zoom Ekstrem Menembus Planet */
        }
        .planet-curtain.visible {
          opacity: 1;
          transform: scale(1);
        }
        .planet-img {
          width: 100vw;
          height: 100vh;
          object-fit: cover;
          animation: spin-planet 120s linear infinite;
        }
        @keyframes spin-planet {
          0% { transform: scale(1.42) rotate(0deg); }
          100% { transform: scale(1.42) rotate(360deg); }
        }
      `}</style>

      <Script 
        src="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js"
        onLoad={() => setIsScriptReady(true)}
      />

      {/* LAYER 1: TIRAI LITTLE PLANET */}
      {/* Menggunakan div hitam sebagai cover cadangan jika gambar belum diupload */}
      <div className={`planet-curtain ${tourState === "pending" ? "visible" : "hidden"}`}>
        {introPlanetUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={introPlanetUrl} alt="Intro Planet" className="planet-img" />
        )}
      </div>

      {/* LAYER 2: DIALOG MULAI */}
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
      
      {/* LAYER 3: PENAMPIL TUR 360 */}
      <div id="public-tour-container" ref={viewerRef} className="w-full h-full cursor-move z-0" />
    </div>
  );
}