"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, GripVertical, Layers, Loader2, Star, XCircle } from "lucide-react";
import { reorderScenesAction } from "@/app/admin/properti/[id]/tour/actions";
import type { EditorScene } from "./types";

type Props = {
  scenes: EditorScene[];
  propertyId: string;
  activeSceneId: string;
  onSelectScene: (id: string) => void;
};

type Notice = { type: "success" | "error"; text: string } | null;

export default function TourEditorToolbar({ scenes, propertyId, activeSceneId, onSelectScene }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<EditorScene[]>(scenes);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  useEffect(() => setItems(scenes), [scenes]);

  const originalOrder = useMemo(() => scenes.map((scene) => scene.id).join("|"), [scenes]);
  const currentOrder = items.map((scene) => scene.id).join("|");

  const movePreview = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    setItems((current) => {
      const from = current.findIndex((item) => item.id === draggedId);
      const to = current.findIndex((item) => item.id === targetId);
      if (from < 0 || to < 0 || from === to) return current;
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const saveOrder = async () => {
    setDraggedId(null);
    if (currentOrder === originalOrder || saving) return;

    setSaving(true);
    setNotice(null);
    const formData = new FormData();
    formData.set("propertyId", propertyId);
    formData.set("orderedIds", JSON.stringify(items.map((scene) => scene.id)));

    try {
      const result = await reorderScenesAction(formData);
      if (!result.success) {
        setItems(scenes);
        setNotice({ type: "error", text: result.error || "Urutan gagal disimpan." });
        return;
      }
      setNotice({ type: "success", text: result.message || "Urutan berhasil disimpan." });
      router.refresh();
    } catch (error) {
      console.error("reorder scenes failed:", error);
      setItems(scenes);
      setNotice({ type: "error", text: "Koneksi ke server gagal. Urutan dikembalikan seperti semula." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-[#D6A34A]/20">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <Layers size={17} className="text-[#D6A34A] shrink-0" />
          <div>
            <p className="text-sm font-black text-[#4A2F1B]">Urutan Ruangan</p>
            <p className="text-[11px] text-gray-400">Tarik kartu untuk mengubah urutan. Nomor 1 menjadi tampilan awal user.</p>
          </div>
        </div>
        {saving && <span className="text-xs font-bold text-[#D6A34A] flex items-center gap-1.5"><Loader2 size={14} className="animate-spin" /> Menyimpan...</span>}
      </div>

      {notice && (
        <div className={`mb-3 rounded-xl border px-3 py-2 text-xs font-bold flex items-center gap-2 ${notice.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-600"}`}>
          {notice.type === "success" ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
          <span>{notice.text}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-2.5" role="list" aria-label="Urutan ruangan virtual tour">
        {items.map((scene, idx) => {
          const active = activeSceneId === scene.id;
          const dragging = draggedId === scene.id;
          return (
            <div
              key={scene.id}
              role="listitem"
              draggable={!saving}
              onDragStart={(event) => {
                setDraggedId(scene.id);
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", scene.id);
              }}
              onDragEnter={(event) => {
                event.preventDefault();
                movePreview(scene.id);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
              }}
              onDrop={(event) => event.preventDefault()}
              onDragEnd={saveOrder}
              className={`group flex items-center rounded-xl border shadow-sm transition-all select-none ${
                dragging ? "opacity-45 scale-95 border-[#D6A34A]" : "opacity-100"
              } ${active ? "bg-[#4A2F1B] border-[#4A2F1B] text-white" : "bg-[#FFF9EF] border-[#D6A34A]/30 text-[#4A2F1B] hover:border-[#D6A34A]"}`}
            >
              <span className={`h-10 w-9 flex items-center justify-center cursor-grab active:cursor-grabbing border-r ${active ? "border-white/10 text-[#D6A34A]" : "border-[#D6A34A]/20 text-[#9b7a55]"}`} title="Tarik untuk memindahkan">
                <GripVertical size={17} aria-hidden="true" />
              </span>
              <button
                type="button"
                disabled={saving}
                onClick={() => onSelectScene(scene.id)}
                className="h-10 px-3 flex items-center gap-2 text-xs font-bold whitespace-nowrap disabled:opacity-60"
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${active ? "bg-[#D6A34A] text-[#281C15]" : "bg-white border border-[#D6A34A]/30"}`}>{idx + 1}</span>
                <span>{scene.name}</span>
                {idx === 0 && (
                  <span title="Tampilan pertama user" aria-label="Tampilan pertama user">
                    <Star size={12} fill="currentColor" className="text-[#D6A34A]" aria-hidden="true" />
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
