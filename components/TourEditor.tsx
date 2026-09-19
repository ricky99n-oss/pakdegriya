"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { Crosshair, Target, Save, Trash2, Layers } from "lucide-react";
import { 
  createHotspotAction, 
  deleteHotspotAction, 
  updateSceneAudioAction,
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

  useEffect(() => {
    if (viewerInstance.current) {
      try { viewerInstance.current.destroy(); } catch(e) {}
      viewerInstance.current = null;
    }

    if (isReady && viewerRef.current && window.pannellum && currentScene) {
      
      // Menggunakan custom hotspot agar visualnya persis dengan viewer pengunjung
      const mappedHotspots = sceneHotspots.map(h => ({
        pitch: h.pitch,
        yaw: h.yaw,
        type: "custom",
        cssClass: "pakde-hotspot-wrapper",
        createTooltipFunc: (hotSpotDiv: HTMLElement, args: string) => {
          const dot = document.createElement('div');
          dot.classList.add('pakde-hotspot-dot');
          hotSpotDiv.appendChild(dot);
          
          const label = document.createElement('div');
          label.classList.add('pakde-hotspot-label');
          label.innerHTML = args;
          hotSpotDiv.appendChild(label);
        },
        createTooltipArgs: h.label
      }));

      viewerInstance.current = window.pannellum.viewer(viewerRef.current.id, {
        type: "equirectangular",
        panorama: `/api/media/${currentScene.mediaId}`,
        autoLoad: true, 
        hfov: 120,
        compass: false,
        showControls: true,
        hotSpots: mappedHotspots 
      });
    }

    return () => {
      if (viewerInstance.current) {
        try { viewerInstance.current.destroy(); } catch(e) {}
      }
    };
  }, [isReady, activeSceneId, currentScene, sceneHotspots]);

  const handleCaptureCoords = () => {
    if (viewerInstance.current) {
      setPitch(viewerInstance.current.getPitch());
      setYaw(viewerInstance.current.getYaw());
    }
  };

  if (existingScenes.length === 0) return null;

  return (
    <div className="space-y-6">
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css" />
      
      {/* Memasukkan style hotspot yang sama persis dengan viewer */}
      <style>{`
        .pakde-hotspot-wrapper { position: relative; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; pointer-events: none; }
        .pakde-hotspot-dot { width: 32px; height: 32px; background-color: rgba(255, 255, 255, 0.9); border: 4px solid #D6A34A; border-radius: 50%; box-shadow: 0 4px 10px rgba(0,0,0,0.5); }
        .pakde-hotspot-label { position: absolute; bottom: 45px; left: 50%; transform: translateX(-50%); background: rgba(74, 47, 27, 0.95); color: white; padding: 6px 14px; border-radius: 12px; font-size: 13px; font-weight: 700; white-space: nowrap; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 1px solid rgba(214, 163, 74, 0.3); }
      `}</style>

      <Script src="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js" onLoad={() => setIsReady(true)} />

      <div className="flex flex-wrap gap-2 bg-white p-4 rounded-2xl shadow-sm border border-[#D6A34A]/20 items-center">
        <span className="text-xs font-bold text-[#4A2F1B] flex items-center gap-1.5 mr-2">
          <Layers size={16} className="text-[#D6A34A]" /> Pilih Ruangan:
        </span>
        {existingScenes.map((scene, idx) => (
          <button
            key={scene.id}
            onClick={() => { setActiveSceneId(scene.id); setPitch(""); setYaw(""); }}
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
                {/* Visual Target Sniper agar admin mudah menentukan pusat layar */}
                <Crosshair className="text-[#D6A34A] drop-shadow-md" size={40} strokeWidth={2} />
              </div>
              <div key={activeSceneId} id={`tour-canvas-${activeSceneId}`} ref={viewerRef} className="w-full h-full cursor-crosshair" />
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
                  <button type="submit" disabled={pitch === "" || yaw === ""} className="w-full text-xs px-4 py-2.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg font-bold hover:bg-blue-200 transition-colors disabled:opacity-50">
                    Jadikan Pandangan Awal Kamera
                  </button>
                </form>

                <form action={createHotspotAction} className="space-y-3">
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

                  <button type="submit" disabled={pitch === "" || yaw === ""} className="w-full flex items-center justify-center gap-2 bg-[#D6A34A] text-[#281C15] font-bold py-3 px-4 rounded-lg hover:bg-[#c2913b] transition-all shadow-md disabled:opacity-50 mt-2">
                    <Save size={16} /> Simpan Titik Hotspot
                  </button>
                </form>
              </div>

              <div className="bg-white p-5 rounded-xl border border-[#D6A34A]/30">
                <h3 className="text-sm font-bold text-[#4A2F1B] mb-3 border-b pb-2">Audio & Putaran Kamera</h3>
                <form action={updateSceneAudioAction} className="space-y-3">
                  <input type="hidden" name="propertyId" value={propertyId} />
                  <input type="hidden" name="sceneId" value={currentScene.id} />
                  
                  <div>
                    <label className="block text-xs font-bold text-[#281C15] mb-1">Pilih Audio (Voice Over/Musik)</label>
                    <select name="audioMediaId" defaultValue={currentScene.audioMediaId || ""} className="w-full border border-gray-300 p-2 rounded-lg bg-gray-50 text-xs font-medium text-gray-700 focus:border-[#D6A34A] focus:outline-none">
                      <option value="">-- Tanpa Audio --</option>
                      {availableAudios.map(audio => (
                        <option key={audio.id} value={audio.id}>{audio.fileName}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-[#281C15] mb-1">Kecepatan Putaran (Auto-rotate)</label>
                    <input type="number" step="0.1" name="autoRotateSpeed" defaultValue={currentScene.autoRotateSpeed ?? 2} className="w-full border border-gray-300 p-2 rounded-lg bg-gray-50 text-xs font-bold font-mono focus:border-[#D6A34A] focus:outline-none" />
                    <p className="text-[10px] text-gray-500 mt-1 leading-tight">Gunakan nilai negatif (Misal: -2) untuk putaran ke kiri. Isi 0 untuk mematikan putaran.</p>
                  </div>
                  
                  <button type="submit" className="w-full flex items-center justify-center gap-2 bg-[#4A2F1B] text-[#D6A34A] font-bold py-2.5 px-4 rounded-lg hover:bg-[#281C15] transition-all shadow-md text-xs mt-2">
                    <Save size={14} /> Perbarui Ruangan Ini
                  </button>
                </form>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-200">
                <h3 className="text-sm font-bold text-[#4A2F1B] mb-3 border-b pb-2">Daftar Hotspot ({sceneHotspots.length})</h3>
                {sceneHotspots.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Belum ada titik yang dibuat di ruangan ini.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {sceneHotspots.map(hs => (
                      <div key={hs.id} className="flex items-center justify-between bg-gray-50 p-2.5 rounded-lg border border-gray-100 text-xs shadow-sm hover:border-[#D6A34A]/50 transition-colors">
                        <div>
                          <p className="font-bold text-[#4A2F1B]">{hs.label}</p>
                          <p className="font-mono text-gray-500 text-[10px] mt-0.5">p:{hs.pitch.toFixed(1)}, y:{hs.yaw.toFixed(1)}</p>
                        </div>
                        <form action={deleteHotspotAction}>
                          <input type="hidden" name="hotspotId" value={hs.id} />
                          <input type="hidden" name="propertyId" value={propertyId} />
                          <button type="submit" className="text-red-500 hover:text-white hover:bg-red-500 p-1.5 rounded-md transition-colors" title="Hapus Hotspot">
                            <Trash2 size={14} />
                          </button>
                        </form>
                      </div>
                    ))}
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