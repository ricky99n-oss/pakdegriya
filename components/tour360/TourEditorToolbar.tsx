"use client";

import { Layers } from "lucide-react";
import type { EditorScene } from "./types";

type Props = {
  scenes: EditorScene[];
  activeSceneId: string;
  onSelectScene: (id: string) => void;
};

export default function TourEditorToolbar({ scenes, activeSceneId, onSelectScene }: Props) {
  return (
    <div className="flex flex-wrap gap-2 bg-white p-4 rounded-2xl shadow-sm border border-[#D6A34A]/20 items-center">
      <span className="text-xs font-bold text-[#4A2F1B] flex items-center gap-1.5 mr-2">
        <Layers size={16} className="text-[#D6A34A]" /> Pilih Ruangan:
      </span>
      {scenes.map((scene, idx) => (
        <button
          type="button"
          key={scene.id}
          onClick={() => onSelectScene(scene.id)}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm border ${
            activeSceneId === scene.id
              ? "bg-[#4A2F1B] text-[#D6A34A] border-[#D6A34A]"
              : "bg-[#FFF7E8] text-[#4A2F1B] hover:bg-[#D6A34A]/20 border-[#D6A34A]/30"
          }`}
        >
          {idx + 1}. {scene.name}
        </button>
      ))}
    </div>
  );
}
