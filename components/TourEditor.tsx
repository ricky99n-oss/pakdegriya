"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { Crosshair, Target, Save, Trash2, Layers } from "lucide-react";
import { 
  createHotspotAction, 
  deleteHotspotAction, 
  updateSceneNameAction,
  deleteSceneAction,
  setFirstSceneAction,
  setInitialViewAction
} from "@/app/admin/properti/[id]/tour/actions";

declare global {
  interface Window {
    pannellum: any;
  }
}

export default function TourEditor({ 
  existingScenes,
  propertyId,
  allHotspots,
  availableAudios
}: { 
  existingScenes: any[];
  propertyId: string;
  allHotspots: any[];
  availableAudios: any[]; 
}) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const viewerInstance = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  
  const [activeSceneId, setActiveSceneId] = useState<string>(
    existingScenes.length > 0 ? existingScenes[0].id : ""
  );

  const [pitch, setPitch] = useState<number | string>("");
  const [yaw, setYaw] = useState<number | string>("");

  const currentScene = existingScenes.find(s => s.id === activeSceneId);
  const sceneHotspots = allHotspots.filter(h => h.sceneId === activeSceneId);

  // Fungsi Render Kustom Hotspot Editor
  const renderCustomHotspot = (hotSpotDiv: HTMLElement, args: any) => {
    const { label, iconType, targetImage } = args;
    
    // Clear the div
    hotSpotDiv.innerHTML = '';
    hotSpotDiv.classList.add('pakde-hotspot-wrapper');

    const dot = document.createElement('div');

    if (iconType === 'thumbnail' && targetImage) {
      dot.classList.add('pakde-hotspot-thumbnail');
      dot.style.backgroundImage = `url(${targetImage})`;
    } else {
      dot.classList.add('pakde-hotspot-dot');
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
    
    const labelDiv = document.createElement('div');
    labelDiv.classList.add('door-label');
    labelDiv.innerHTML = label;
    hotSpotDiv.appendChild(labelDiv);
  };

  useEffect(() => {
    if (!isReady || !viewerRef.current || !window.pannellum || !currentScene) return;

    if (viewerInstance.current) {
      try { viewerInstance.current.destroy(); } catch(e) {}
    }

    const mappedHotspots = sceneHotspots.map(h => {
      const [rawLabel, iconType = "door"] = (h.label || "").split("|||");
      const targetScene = existingScenes.find(s => s.id === h.targetSceneId);
      const targetImage = targetScene ? `/api/media/${targetScene.mediaId}` : "";

      return {
        pitch: h.pitch,
        yaw: h.yaw,
        type: "custom",
        createTooltipFunc: renderCustomHotspot,
        createTooltipArgs: { label: rawLabel, iconType, targetImage }
      };
    });

    viewerInstance.current = window.pannellum.viewer(viewerRef.current.id, {
      type: "equirectangular",
      panorama: `/api/media/${currentScene.mediaId}`,
      autoLoad: true, 
      hfov: 90, 
      compass: false,
      showControls: true,
      hotSpots: mappedHotspots 
    });

    return () => {
      if (viewerInstance.current) {
        try { viewerInstance.current.destroy(); } catch(e) {}
        viewerInstance.current = null;
      }
    };
  }, [isReady, activeSceneId, currentScene, sceneHotspots, existingScenes]);

  const handleCaptureCoords = () => {
    if (viewerInstance.current) {
      setPitch(viewerInstance.current.getPitch());
      setYaw(viewerInstance.current.getYaw());
    }
  };

  const handleHotspotSubmit = async (formData: FormData) => {
    const label = formData.get("label") as string;
    const iconType = formData.get("iconType") as string;
    
    formData.set("label", `${label}|||${iconType}`);
    await createHotspotAction(formData);
    
    setPitch(""); setYaw(""); 
  };

  const gantiRuangan = (id: string) => {
    setActiveSceneId(id);
    setPitch(""); 
    setYaw("");
  };

  if (existingScenes.length === 0) return null;

  return (
    <div className="space-y-6">
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css" />
      
      <style>{`
        .pakde-hotspot-wrapper { position: absolute; z-index: 2; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 50px; height: 50px; margin-left: -25px; margin-top: -25px; }
        .pakde-hotspot-dot { width: 44px; height: 44px; border-radius: 50%; border: 3px solid rgba(255,255,255,0.8); background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 10px rgba(0,0,0,0.5); transition: all 0.3s; }
        .pakde-hotspot-thumbnail { width: 60px; height: 60px; border-radius: 50%; border: 3px solid rgba(255,255,255,0.9); background-size: cover; background-position: center; box-shadow: 0 4px 15px rgba(0,0,0,0.6); transition: all 0.3s; margin-left: -5px; margin-top: -5px;}
        .pakde-hotspot-wrapper:hover .pakde-hotspot-dot, .pakde-hotspot-wrapper:hover .pakde-hotspot-thumbnail { transform: scale(1.15); border-color: #D6A34A; }
        .door-icon { display: flex; align-items: center; justify-content: center; }
        .door-label { position: absolute; bottom: 100%; margin-bottom: 10px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.8); color: white; padding: 6px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; white-space: nowrap; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); pointer-events: none;}
      `}</style>

      <Script src="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js" onLoad={() => setIsReady(true)} />

      <div className="flex flex-wrap gap-2 bg-white p-4 rounded-2xl shadow-sm border border-[#D6A34A]/20 items-center">
        <span className="text-xs font-bold text-[#4A2F1B] flex items-center gap-1.5 mr-2">
          <Layers size={16} className="text-[#D6A34A]" /> Pilih Ruangan:
        </span>
        {existingScenes.map((scene, idx) => (
          <button
            key={scene.id}
            onClick={() => gantiRuangan(scene.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
              activeSceneId === scene.id
                ? "bg-[#4A2F1B] text-[#D6A34A] border border-[#D6A34A]"
                : "bg-[#FFF7E8] text-[#4A2F1B] hover:bg-[#D6A34A]/20 border border-[#D6A34A]/30"
            }`}
          >
            {idx + 1}. {scene.name}
          </button>
        ))}
      </div>

      {currentScene && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#D6A34A]/20">
          
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b-2 border-[#D6A34A]/30 pb-4 mb-6">
            <div className="space-y-3">
              <form action={updateSceneNameAction} className="flex items-center gap-3">
                <input type="hidden" name="sceneId" value={currentScene.id} />
                <input type="hidden" name="propertyId" value={propertyId} />
                <span className="text-xl font-black text-[#4A2F1B]">Ruangan Aktif:</span>
                <input 
                  type="text" 
                  name="name" 
                  defaultValue={currentScene.name} 
                  className="text-xl font-black text-[#D6A34A] bg-transparent border-b border-dashed border-[#D6A34A] focus:outline-none focus:border-solid hover:bg-[#FFF7E8] px-1 rounded transition-colors w-48 md:w-64"
                />
                <button type="submit" className="text-xs bg-[#FFF7E8] text-[#4A2F1B] px-3 py-1.5 rounded-lg border border-[#D6A34A]/30 hover:bg-[#D6A34A] font-bold transition-colors">
                  Simpan Nama
                </button>
              </form>

              <form action={setFirstSceneAction}>
                <input type="hidden" name="sceneId" value={currentScene.id} />
                <input type="hidden" name="propertyId" value={propertyId} />
                <button type="submit" className={`text-xs px-4 py-2 rounded-lg font-bold transition-colors ${currentScene.isFirstScene ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'}`}>
                  {currentScene.isFirstScene ? '★ Ruangan Ini Tampil Pertama' : 'Jadikan Ruangan Pertama Muncul'}
                </button>
              </form>
            </div>
            
            <form action={deleteSceneAction}>
              <input type="hidden" name="sceneId" value={currentScene.id} />
              <input type="hidden" name="propertyId" value={propertyId} />
              <button type="submit" className="text-red-600 bg-red-50 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors">
                Hapus Ruangan Ini
              </button>
            </form>
          </div>

          <div className="flex flex-col xl:flex-row gap-6">
            
            <div className="w-full xl:w-2/3 h-[500px] relative bg-black rounded-xl overflow-hidden shadow-inner border-2 border-gray-200">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <Crosshair className="text-[#D6A34A] drop-shadow-md" size={40} strokeWidth={2} />
              </div>
              <div key={activeSceneId} id={`tour-canvas-admin`} ref={viewerRef} className="w-full h-full cursor-crosshair" />
            </div>

            <div className="w-full xl:w-1/3 flex flex-col gap-4">
              
              <div className="bg-[#FFF7E8] p-5 rounded-xl border border-[#D6A34A]/30">
                <h3 className="text-lg font-bold text-[#4A2F1B] mb-2 flex items-center gap-2">
                  <Target size={18} /> Kunci Koordinat
                </h3>
                <p className="text-xs text-[#281C15]/70 mb-4">Arahkan tanda silang di layar ke posisi yang tepat, lalu klik tombol di bawah.</p>

                <button 
                  type="button" 
                  onClick={handleCaptureCoords}
                  className="w-full bg-[#4A2F1B] text-white text-sm font-bold py-3 px-4 rounded-lg hover:bg-[#281C15] transition-all shadow-md mb-4 flex justify-center items-center gap-2"
                >
                  <Crosshair size={16}/> Tangkap Titik Kordinat
                </button>

                <form action={setInitialViewAction} className="mb-4 pb-4 border-b border-[#D6A34A]/30">
                  <input type="hidden" name="sceneId" value={currentScene.id} />
                  <input type="hidden" name="propertyId" value={propertyId} />
                  <input type="hidden" name="pitch" value={pitch === "" ? (currentScene.initialPitch || 0) : pitch} />
                  <input type="hidden" name="yaw" value={yaw === "" ? (currentScene.initialYaw || 0) : yaw} />
                  <button type="submit" disabled={pitch === ""} className="w-full text-xs px-4 py-2.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg font-bold hover:bg-blue-200 transition-colors disabled:opacity-50">
                    Jadikan Pandangan Awal Kamera
                  </button>
                </form>

                <form action={handleHotspotSubmit} className="space-y-3">
                  <input type="hidden" name="propertyId" value={propertyId} />
                  <input type="hidden" name="sceneId" value={currentScene.id} />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">PITCH (Vertikal)</label>
                      <input type="text" name="pitch" value={pitch !== "" ? Number(pitch).toFixed(2) : ""} readOnly className="w-full bg-white border border-gray-300 p-2.5 rounded-lg text-sm text-center font-mono text-gray-900 font-bold" placeholder="-" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">YAW (Horizontal)</label>
                      <input type="text" name="yaw" value={yaw !== "" ? Number(yaw).toFixed(2) : ""} readOnly className="w-full bg-white border border-gray-300 p-2.5 rounded-lg text-sm text-center font-mono text-gray-900 font-bold" placeholder="-" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#281C15] mb-1">Pilih Gaya Ikon</label>
                    <select name="iconType" className="w-full border border-[#D6A34A]/50 p-2.5 rounded-lg bg-white text-[#281C15] text-sm focus:outline-none focus:ring-1 focus:ring-[#D6A34A]">
                      <option value="door">🚪 Ikon Pintu Klasik</option>
                      <option value="arrow">⬆️ Ikon Panah Arah</option>
                      <option value="thumbnail">🖼️ Thumbnail Foto Ruangan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#281C15] mb-1">Pilih Ruangan Tujuan</label>
                    <select name="targetSceneId" required className="w-full border border-[#D6A34A]/50 p-2.5 rounded-lg bg-white text-[#281C15] text-sm focus:outline-none focus:ring-1 focus:ring-[#D6A34A]">
                      <option value="">-- Pilih Tujuan --</option>
                      {existingScenes.filter(s => s.id !== currentScene.id).map(scene => (
                        <option key={scene.id} value={scene.id}>{scene.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#281C15] mb-1">Label Tombol</label>
                    <input type="text" name="label" required className="w-full border border-[#D6A34A]/50 p-2.5 rounded-lg bg-white text-[#281C15] text-sm focus:outline-none focus:ring-1 focus:ring-[#D6A34A]" placeholder="Mis: Menuju Dapur..." />
                  </div>

                  <button type="submit" disabled={pitch === ""} className="w-full flex items-center justify-center gap-2 bg-[#D6A34A] text-[#281C15] font-bold py-3 px-4 rounded-lg hover:bg-[#c2913b] transition-all shadow-md disabled:opacity-50 mt-2">
                    <Save size={16} /> Simpan Titik Hotspot
                  </button>
                </form>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-200">
                <h3 className="text-sm font-bold text-[#4A2F1B] mb-3 border-b pb-2">Daftar Hotspot ({sceneHotspots.length})</h3>
                {sceneHotspots.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Belum ada titik yang dibuat di ruangan ini.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {sceneHotspots.map(hs => {
                      const [realLabel, iconType = "door"] = (hs.label || "").split("|||");
                      const targetSceneName = existingScenes.find(s => s.id === hs.targetSceneId)?.name || "Unknown";
                      return (
                        <div key={hs.id} className="flex items-center justify-between bg-gray-50 p-2.5 rounded-lg border border-gray-100 text-xs shadow-sm hover:border-[#D6A34A]/50 transition-colors">
                          <div>
                            <p className="font-bold text-[#4A2F1B]">{targetSceneName}</p>
                            <p className="text-[10px] text-gray-500 uppercase mt-0.5">Style: {iconType} | {realLabel}</p>
                          </div>
                          <form action={deleteHotspotAction}>
                            <input type="hidden" name="hotspotId" value={hs.id} />
                            <input type="hidden" name="propertyId" value={propertyId} />
                            <button type="submit" className="text-red-500 hover:text-white hover:bg-red-500 p-1.5 rounded-md transition-colors" title="Hapus Hotspot">
                              <Trash2 size={14} />
                            </button>
                          </form>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}