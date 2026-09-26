import { FileText, Globe2, Headphones, ImageIcon, Lock, Sparkles, Trash2, View } from "lucide-react";
import ActionForm from "@/components/admin/ActionForm";
import { deleteMediaAction, updateMediaVisibilityAction } from "@/app/admin/properti/[id]/actions";

type MediaItem = {
  id: string;
  property_id: string;
  file_type: string;
  file_name: string;
  mime_type: string;
  is_public?: boolean | null;
  created_at?: string | null;
};

type Props = {
  propertyId: string;
  mediaFiles: MediaItem[];
};

const GROUPS = [
  { key: "panorama_private", title: "Foto 360°", description: "Panorama equirectangular untuk Virtual Tour", icon: View },
  { key: "intro_planet_public", title: "Little Planet", description: "Intro awal sebelum user masuk ke Virtual Tour", icon: Sparkles },
  { key: "gallery_private", title: "Galeri Foto", description: "Foto biasa properti", icon: ImageIcon },
  { key: "cover_public", title: "Cover Utama", description: "Foto utama kartu dan halaman properti", icon: ImageIcon },
  { key: "floorplan_private", title: "Denah / Floorplan", description: "Denah gambar atau PDF", icon: FileText },
  { key: "audio_private", title: "Audio", description: "Musik atau narasi per ruangan", icon: Headphones },
] as const;

export default function MediaLibrary({ propertyId, mediaFiles }: Props) {
  if (!mediaFiles.length) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
        <ImageIcon className="mx-auto text-gray-300 mb-3" size={34} />
        <p className="text-gray-500 font-medium">Belum ada media yang diunggah.</p>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {GROUPS.map((group) => {
        const items = mediaFiles.filter((media) => media.file_type === group.key);
        if (!items.length) return null;
        const Icon = group.icon;

        return (
          <section key={group.key} className="rounded-2xl border border-[#D6A34A]/20 overflow-hidden bg-white">
            <div className="px-4 md:px-5 py-4 bg-[#FFF9EF] border-b border-[#D6A34A]/15 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#D6A34A]/15 text-[#9B6A1A] flex items-center justify-center shrink-0">
                  <Icon size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-[#4A2F1B] text-sm md:text-base">{group.title}</h3>
                  <p className="text-[10px] md:text-xs text-gray-400 truncate">{group.description}</p>
                </div>
              </div>
              <span className="text-xs font-black text-[#4A2F1B] bg-white border border-[#D6A34A]/20 rounded-full px-2.5 py-1">{items.length}</span>
            </div>

            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {items.map((media) => (
                <MediaCard key={media.id} propertyId={propertyId} media={media} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function MediaCard({ propertyId, media }: { propertyId: string; media: MediaItem }) {
  const isAudio = media.file_type === "audio_private";
  const isPdf = media.mime_type === "application/pdf";
  const isPublic = Boolean(media.is_public);

  return (
    <article className="rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm group">
      <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
        {isAudio ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#4A2F1B] bg-[#FFF7E8] px-4">
            <Headphones size={38} className="text-[#D6A34A] mb-3" />
            <span className="text-xs font-bold text-center break-all line-clamp-2">{media.file_name}</span>
          </div>
        ) : isPdf ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#4A2F1B] bg-gray-50">
            <FileText size={38} className="text-[#D6A34A] mb-3" />
            <span className="text-xs font-bold">Dokumen PDF</span>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/api/media/${media.id}`} alt={media.file_name} loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
        )}

        <div className="absolute top-2 left-2">
          <span className={`backdrop-blur text-white text-[10px] font-black px-2.5 py-1.5 rounded-full flex items-center gap-1.5 shadow ${isPublic ? "bg-emerald-500/95" : "bg-red-500/95"}`}>
            {isPublic ? <Globe2 size={11} /> : <Lock size={11} />}
            {isPublic ? "Publik" : "Privat"}
          </span>
        </div>
      </div>

      <div className="p-3.5 space-y-3">
        <p className="text-[11px] font-mono text-gray-400 truncate" title={media.file_name}>{media.file_name}</p>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <ActionForm action={updateMediaVisibilityAction} refreshOnSuccess>
            <input type="hidden" name="propertyId" value={propertyId} />
            <input type="hidden" name="mediaId" value={media.id} />
            <input type="hidden" name="makePublic" value={isPublic ? "false" : "true"} />
            <button type="submit" className={`w-full h-9 rounded-lg text-xs font-black border transition-colors ${isPublic ? "bg-red-50 text-red-600 border-red-100 hover:bg-red-100" : "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100"}`}>
              {isPublic ? "Jadikan Privat" : "Jadikan Publik"}
            </button>
          </ActionForm>

          <ActionForm action={deleteMediaAction} confirmMessage="Hapus media ini secara permanen?">
            <input type="hidden" name="mediaId" value={media.id} />
            <input type="hidden" name="propertyId" value={propertyId} />
            <input type="hidden" name="fileName" value={media.file_name} />
            <button type="submit" className="h-9 w-9 rounded-lg bg-gray-100 text-gray-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors" aria-label="Hapus media" title="Hapus media">
              <Trash2 size={16} />
            </button>
          </ActionForm>
        </div>
      </div>
    </article>
  );
}
