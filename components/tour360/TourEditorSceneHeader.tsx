"use client";

import {
  deleteSceneAction,
  setFirstSceneAction,
  updateSceneNameAction,
} from "@/app/admin/properti/[id]/tour/actions";
import type { EditorScene } from "./types";

type Props = { scene: EditorScene; propertyId: string };

export default function TourEditorSceneHeader({ scene, propertyId }: Props) {
  return (
    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b-2 border-[#D6A34A]/30 pb-4 mb-6">
      <div className="space-y-3">
        <form action={updateSceneNameAction} className="flex flex-wrap items-center gap-3">
          <input type="hidden" name="sceneId" value={scene.id} />
          <input type="hidden" name="propertyId" value={propertyId} />
          <span className="text-xl font-black text-[#4A2F1B]">Ruangan Aktif:</span>
          <input
            type="text"
            name="name"
            defaultValue={scene.name}
            className="text-xl font-black text-[#D6A34A] bg-transparent border-b border-dashed border-[#D6A34A] focus:outline-none focus:border-solid hover:bg-[#FFF7E8] px-1 rounded transition-colors w-48 md:w-64"
          />
          <button
            type="submit"
            className="text-xs bg-[#FFF7E8] text-[#4A2F1B] px-3 py-1.5 rounded-lg border border-[#D6A34A]/30 hover:bg-[#D6A34A] font-bold transition-colors"
          >
            Simpan Nama
          </button>
        </form>

        <form action={setFirstSceneAction}>
          <input type="hidden" name="sceneId" value={scene.id} />
          <input type="hidden" name="propertyId" value={propertyId} />
          <button
            type="submit"
            className={`text-xs px-4 py-2 rounded-lg font-bold transition-colors border ${
              scene.isFirstScene
                ? "bg-green-100 text-green-700 border-green-300"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200"
            }`}
          >
            {scene.isFirstScene ? "★ Ruangan Ini Tampil Pertama" : "Jadikan Ruangan Pertama Muncul"}
          </button>
        </form>
      </div>

      <form action={deleteSceneAction}>
        <input type="hidden" name="sceneId" value={scene.id} />
        <input type="hidden" name="propertyId" value={propertyId} />
        <button
          type="submit"
          className="text-red-600 bg-red-50 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
        >
          Hapus Ruangan Ini
        </button>
      </form>
    </div>
  );
}
