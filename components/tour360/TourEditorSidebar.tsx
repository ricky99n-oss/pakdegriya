"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Crosshair, Save, Target, Trash2, Loader2, CheckCircle2, XCircle } from "lucide-react";
import {
  deleteHotspotAction,
  setInitialViewAction,
} from "@/app/admin/properti/[id]/tour/actions";
import ActionForm from "@/components/admin/ActionForm";
import { parseHotspotLabel } from "./hotspot";
import type { CoordinateValue, EditorHotspot, EditorScene } from "./types";

type Props = {
  currentScene: EditorScene;
  scenes: EditorScene[];
  hotspots: EditorHotspot[];
  propertyId: string;
  pitch: CoordinateValue;
  yaw: CoordinateValue;
  viewerBusy: boolean;
  onCapture: () => void;
};

export default function TourEditorSidebar({
  currentScene, scenes, hotspots, propertyId, pitch, yaw, viewerBusy, onCapture,
}: Props) {
  const hasCoords = pitch !== "" && yaw !== "";

  return (
    <div className="w-full xl:w-1/3 flex flex-col gap-4">
      <div className="bg-[#FFF7E8] p-5 rounded-xl border border-[#D6A34A]/30">
        <h3 className="text-lg font-bold text-[#4A2F1B] mb-2 flex items-center gap-2"><Target size={18} /> Kunci Koordinat</h3>
        <p className="text-xs text-[#281C15]/70 mb-4">Arahkan tanda silang ke posisi hotspot, lalu tangkap koordinatnya.</p>

        <button type="button" onClick={onCapture} disabled={viewerBusy} className="w-full bg-[#4A2F1B] text-white text-sm font-bold py-3 px-4 rounded-lg hover:bg-[#281C15] transition-all shadow-md mb-4 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
          <Crosshair size={16} /> Tangkap Titik Koordinat
        </button>

        <ActionForm action={setInitialViewAction} className="mb-4 pb-4 border-b border-[#D6A34A]/30">
          <input type="hidden" name="sceneId" value={currentScene.id} />
          <input type="hidden" name="propertyId" value={propertyId} />
          <input type="hidden" name="pitch" value={pitch === "" ? currentScene.initialPitch ?? 0 : pitch} />
          <input type="hidden" name="yaw" value={yaw === "" ? currentScene.initialYaw ?? 0 : yaw} />
          <button type="submit" disabled={!hasCoords} className="w-full text-xs px-4 py-2.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg font-bold hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            Jadikan Pandangan Awal Kamera
          </button>
        </ActionForm>

        <HotspotCreateForm
          propertyId={propertyId}
          sceneId={currentScene.id}
          scenes={scenes}
          pitch={pitch}
          yaw={yaw}
          disabled={!hasCoords || viewerBusy}
        />
      </div>
      <HotspotList hotspots={hotspots} scenes={scenes} propertyId={propertyId} />
    </div>
  );
}

function HotspotCreateForm({
  propertyId,
  sceneId,
  scenes,
  pitch,
  yaw,
  disabled,
}: {
  propertyId: string;
  sceneId: string;
  scenes: EditorScene[];
  pitch: CoordinateValue;
  yaw: CoordinateValue;
  disabled: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || disabled) return;

    const form = event.currentTarget;
    const targetSceneId = String(new FormData(form).get("targetSceneId") || "");
    const label = String(new FormData(form).get("label") || "").trim();
    const iconType = String(new FormData(form).get("iconType") || "door");

    setPending(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/tour/hotspot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          propertyId,
          sceneId,
          targetSceneId,
          pitch,
          yaw,
          label,
          iconType,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Hotspot gagal disimpan.");
      }

      setSuccess(payload.message || "Hotspot berhasil disimpan.");
      form.reset();
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Koneksi ke server gagal. Silakan coba lagi."
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3" aria-busy={pending}>
      <fieldset disabled={pending || disabled} className="contents">
        <div className="grid grid-cols-2 gap-3">
          <CoordinateField label="PITCH (Vertikal)" name="pitch" value={pitch} />
          <CoordinateField label="YAW (Horizontal)" name="yaw" value={yaw} />
        </div>
        <div>
          <label className="block text-xs font-bold text-[#281C15] mb-1">Pilih Gaya Ikon</label>
          <select name="iconType" defaultValue="door" className="w-full border border-[#D6A34A]/50 p-2.5 rounded-lg bg-white text-[#281C15] text-sm focus:outline-none focus:ring-1 focus:ring-[#D6A34A]">
            <option value="door">🚪 Ikon Pintu Klasik</option>
            <option value="arrow">⬆️ Ikon Panah Arah</option>
            <option value="thumbnail">🖼️ Thumbnail Foto Ruangan</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-[#281C15] mb-1">Pilih Ruangan Tujuan</label>
          <select name="targetSceneId" required className="w-full border border-[#D6A34A]/50 p-2.5 rounded-lg bg-white text-[#281C15] text-sm focus:outline-none focus:ring-1 focus:ring-[#D6A34A]">
            <option value="">-- Pilih Tujuan --</option>
            {scenes.filter((scene) => scene.id !== sceneId).map((scene) => <option key={scene.id} value={scene.id}>{scene.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-[#281C15] mb-1">Label Tombol</label>
          <input type="text" name="label" required maxLength={80} className="w-full border border-[#D6A34A]/50 p-2.5 rounded-lg bg-white text-[#281C15] text-sm focus:outline-none focus:ring-1 focus:ring-[#D6A34A] placeholder-gray-400" placeholder="Mis: Menuju Dapur..." />
        </div>
        <button type="submit" className="w-full flex items-center justify-center gap-2 bg-[#D6A34A] text-[#281C15] font-bold py-3 px-4 rounded-lg hover:bg-[#c2913b] transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
          {pending ? <><Loader2 size={16} className="animate-spin" /> Menyimpan...</> : <><Save size={16} /> Simpan Titik Hotspot</>}
        </button>
      </fieldset>

      {(success || error) && (
        <div className={`text-xs rounded-lg border p-3 flex items-start gap-2 ${success ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-700"}`}>
          {success ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> : <XCircle size={16} className="shrink-0 mt-0.5" />}
          <span>{success || error}</span>
        </div>
      )}
    </form>
  );
}

function CoordinateField({ label, name, value }: { label: string; name: string; value: CoordinateValue }) {
  return <div><label className="block text-[10px] font-bold text-gray-500 mb-1">{label}</label><input type="text" name={name} value={value === "" ? "" : Number(value).toFixed(2)} readOnly className="w-full bg-white border border-gray-300 p-2.5 rounded-lg text-sm text-center font-mono text-gray-900 font-bold" placeholder="-" /></div>;
}

function HotspotList({ hotspots, scenes, propertyId }: { hotspots: EditorHotspot[]; scenes: EditorScene[]; propertyId: string }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200">
      <h3 className="text-sm font-bold text-[#4A2F1B] mb-3 border-b pb-2">Daftar Hotspot ({hotspots.length})</h3>
      {hotspots.length === 0 ? <p className="text-xs text-gray-400 italic">Belum ada titik di ruangan ini.</p> : (
        <div className="space-y-2 max-h-56 overflow-y-auto pr-2">
          {hotspots.map((hotspot) => {
            const { label, iconType } = parseHotspotLabel(hotspot.label);
            const target = scenes.find((scene) => scene.id === hotspot.targetSceneId)?.name || "Unknown";
            return (
              <div key={hotspot.id} className="flex items-center justify-between gap-3 bg-gray-50 p-2.5 rounded-lg border border-gray-100 text-xs shadow-sm">
                <div className="min-w-0"><p className="font-bold text-[#4A2F1B] truncate">{target}</p><p className="text-[10px] text-gray-500 uppercase truncate">{iconType} | {label}</p></div>
                <ActionForm action={deleteHotspotAction} confirmMessage={`Hapus hotspot menuju ${target}?`}>
                  <input type="hidden" name="hotspotId" value={hotspot.id} />
                  <input type="hidden" name="propertyId" value={propertyId} />
                  <button type="submit" className="text-red-500 hover:text-white hover:bg-red-500 p-1.5 rounded-md transition-colors" title="Hapus Hotspot"><Trash2 size={14} /></button>
                </ActionForm>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
