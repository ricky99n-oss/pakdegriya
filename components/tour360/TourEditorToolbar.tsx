"use client";

import { ChevronLeft, ChevronRight, Layers, Star } from "lucide-react";
import { moveSceneAction } from "@/app/admin/properti/[id]/tour/actions";
import ActionForm from "@/components/admin/ActionForm";
import type { EditorScene } from "./types";

type Props = {
  scenes: EditorScene[];
  propertyId: string;
  activeSceneId: string;
  onSelectScene: (id: string) => void;
};

export default function TourEditorToolbar({ scenes, propertyId, activeSceneId, onSelectScene }: Props) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#D6A34A]/20">
      <div className="flex items-center gap-2 mb-3">
        <Layers size={16} className="text-[#D6A34A]" />
        <span className="text-xs font-bold text-[#4A2F1B]">Urutan Ruangan yang Dilihat User</span>
        <span className="text-[10px] text-gray-400">Gunakan panah kiri / kanan untuk mengatur urutan.</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {scenes.map((scene, idx) => (
          <div key={scene.id} className="flex items-stretch rounded-xl border border-[#D6A34A]/30 overflow-hidden shadow-sm bg-[#FFF7E8]">
            <ActionForm action={moveSceneAction} refreshOnSuccess>
              <input type="hidden" name="propertyId" value={propertyId} />
              <input type="hidden" name="sceneId" value={scene.id} />
              <button
                type="submit"
                name="direction"
                value="up"
                disabled={idx === 0}
                className="px-2 text-[#4A2F1B] hover:bg-[#D6A34A]/20 disabled:opacity-25"
                title="Geser lebih awal"
              >
                <ChevronLeft size={15} />
              </button>
            </ActionForm>

            <button
              type="button"
              onClick={() => onSelectScene(scene.id)}
              className={`px-3 py-2 text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSceneId === scene.id ? "bg-[#4A2F1B] text-[#D6A34A]" : "text-[#4A2F1B] hover:bg-[#D6A34A]/10"
              }`}
            >
              <span>{idx + 1}. {scene.name}</span>
              {scene.isFirstScene && (
                <span title="Ruangan pertama saat tour dibuka" aria-label="Ruangan pertama saat tour dibuka">
                  <Star size={12} fill="currentColor" aria-hidden="true" />
                </span>
              )}
            </button>

            <ActionForm action={moveSceneAction} refreshOnSuccess>
              <input type="hidden" name="propertyId" value={propertyId} />
              <input type="hidden" name="sceneId" value={scene.id} />
              <button
                type="submit"
                name="direction"
                value="down"
                disabled={idx === scenes.length - 1}
                className="px-2 text-[#4A2F1B] hover:bg-[#D6A34A]/20 disabled:opacity-25"
                title="Geser lebih akhir"
              >
                <ChevronRight size={15} />
              </button>
            </ActionForm>
          </div>
        ))}
      </div>
    </div>
  );
}
