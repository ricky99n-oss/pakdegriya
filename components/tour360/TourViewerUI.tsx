"use client";

import {
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Info,
  LayoutGrid,
  Loader2,
  Maximize,
  Minimize,
  MousePointer2,
  Move,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  ZoomIn,
} from "lucide-react";
import type { PublicTourConfig } from "./types";

type Props = {
  tourConfig: PublicTourConfig;
  introPlanetUrl?: string;
  currentSceneId: string;
  started: boolean;
  loading: boolean;
  error: string;
  showTools: boolean;
  showGallery: boolean;
  showGuide: boolean;
  isFullscreen: boolean;
  isAudioPlaying: boolean;
  onStart: (withAudio: boolean) => void;
  onRetry: () => void;
  onToggleAudio: () => void;
  onToggleFullscreen: () => void;
  onPrev: () => void;
  onNext: () => void;
  onScene: (id: string) => void;
  setShowTools: (value: boolean) => void;
  setShowGallery: (value: boolean) => void;
  setShowGuide: (value: boolean) => void;
};

export default function TourViewerUI(props: Props) {
  const {
    tourConfig,
    introPlanetUrl,
    currentSceneId,
    started,
    loading,
    error,
    showTools,
    showGallery,
    showGuide,
    isFullscreen,
    isAudioPlaying,
  } = props;
  const sceneIds = Object.keys(tourConfig.scenes || {});
  const canStart = !loading && !error && !!currentSceneId;

  return (
    <>
      <div className={`planet-curtain ${started ? "hidden" : "visible"}`}>
        {introPlanetUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={introPlanetUrl} alt="Intro Virtual Tour" className="planet-img" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-black via-[#281C15] to-black" />
        )}
      </div>

      {!started && (
        <div className="absolute inset-0 z-[60] bg-black/35 flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-[#111]/90 max-w-sm w-full rounded-3xl p-8 text-center border border-[#D6A34A]/30 shadow-2xl">
            <div className="w-16 h-16 bg-[#D6A34A]/20 rounded-full flex items-center justify-center text-[#D6A34A] mx-auto mb-6">
              <Sparkles size={32} />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Virtual Tour 360°</h2>
            <p className="text-gray-400 text-sm mb-7">Eksplorasi properti secara imersif.</p>

            {loading && !error && (
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mb-5">
                <Loader2 size={16} className="animate-spin" /> Menyiapkan panorama...
              </div>
            )}
            {error && <ErrorMessage message={error} onRetry={props.onRetry} compact />}

            <div className="flex flex-col gap-3 mt-4">
              <button
                type="button"
                disabled={!canStart}
                onClick={() => props.onStart(true)}
                className="w-full flex items-center justify-center gap-2 bg-[#D6A34A] text-black font-bold py-3.5 rounded-full hover:bg-[#e8b65c] disabled:opacity-40 transition-all"
              >
                <Volume2 size={20} /> Mulai Tour
              </button>
              <button
                type="button"
                disabled={!canStart}
                onClick={() => props.onStart(false)}
                className="w-full text-gray-400 font-medium py-2 hover:text-white disabled:opacity-40 text-sm"
              >
                Mulai Tanpa Audio
              </button>
            </div>
          </div>
        </div>
      )}

      {started && error && (
        <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center p-6">
          <ErrorMessage message={error} onRetry={props.onRetry} />
        </div>
      )}

      {started && (
        <>
          <div className="absolute top-6 left-6 z-20 pointer-events-none">
            <h1 className="text-white text-2xl md:text-3xl font-black drop-shadow-lg">
              {tourConfig.scenes[currentSceneId]?.title || "Virtual Tour"}
            </h1>
          </div>

          <button
            type="button"
            onClick={() => props.setShowGuide(true)}
            className="absolute bottom-6 left-6 z-20 w-12 h-12 rounded-full bg-black/60 border border-[#D6A34A]/50 text-[#D6A34A] flex items-center justify-center backdrop-blur-md hover:scale-110 transition-all"
            title="Panduan Navigasi"
          >
            <Info size={22} />
          </button>

          <button
            type="button"
            onClick={props.onToggleAudio}
            className="absolute bottom-6 right-6 z-20 w-12 h-12 rounded-full bg-black/60 border border-[#D6A34A]/50 text-[#D6A34A] flex items-center justify-center backdrop-blur-md hover:scale-110 transition-all"
            title={isAudioPlaying ? "Matikan Suara" : "Nyalakan Suara"}
          >
            {isAudioPlaying ? <Volume2 size={22} /> : <VolumeX size={22} />}
          </button>

          <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-20 transition-all ${showTools ? "opacity-100" : "translate-y-24 opacity-0 pointer-events-none"}`}>
            <div className="bg-black/80 backdrop-blur-md border border-[#D6A34A]/30 rounded-full px-4 md:px-6 py-3 flex items-center gap-4 md:gap-6 shadow-2xl">
              <ToolButton onClick={props.onPrev}><ChevronLeft size={28} /></ToolButton>
              <ToolButton onClick={() => props.setShowGallery(true)}><LayoutGrid size={24} /></ToolButton>
              <Divider />
              <ToolButton onClick={() => props.setShowTools(false)}><ChevronDown size={24} /></ToolButton>
              <Divider />
              <ToolButton onClick={props.onToggleFullscreen}>{isFullscreen ? <Minimize size={22} /> : <Maximize size={22} />}</ToolButton>
              <ToolButton onClick={props.onNext}><ChevronRight size={28} /></ToolButton>
            </div>
          </div>

          {!showTools && (
            <button
              type="button"
              onClick={() => props.setShowTools(true)}
              className="absolute bottom-0 left-1/2 -translate-x-1/2 z-20 bg-black/80 text-[#D6A34A] px-6 py-1 rounded-t-xl border border-[#D6A34A]/30"
            >
              <ChevronUp size={24} />
            </button>
          )}

          {showGallery && (
            <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4 md:p-10">
              <button type="button" onClick={() => props.setShowGallery(false)} className="absolute top-6 right-6 text-white p-2 bg-white/10 rounded-full">
                <X size={32} />
              </button>
              <h3 className="text-2xl font-bold text-[#D6A34A] mb-8">Pilih Ruangan</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 max-w-5xl w-full overflow-y-auto max-h-[70vh] p-2">
                {sceneIds.map((id) => {
                  const scene = tourConfig.scenes[id];
                  const active = id === currentSceneId;
                  return (
                    <button
                      type="button"
                      key={id}
                      onClick={() => props.onScene(id)}
                      className={`relative rounded-xl overflow-hidden aspect-video border-2 transition-all ${active ? "border-[#D6A34A] scale-[1.03]" : "border-transparent hover:border-white/50"}`}
                    >
                      {scene.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img loading="lazy" src={scene.thumbnail} alt={scene.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#281C15] to-black flex items-center justify-center text-[#D6A34A]/70">
                          <LayoutGrid size={34} />
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3 pt-8">
                        <p className={`text-sm font-bold truncate ${active ? "text-[#D6A34A]" : "text-white"}`}>{scene.title}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {showGuide && <NavigationGuide onClose={() => props.setShowGuide(false)} />}
        </>
      )}
    </>
  );
}

function ToolButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className="text-[#D6A34A] hover:text-white hover:scale-110 transition-all p-1">{children}</button>;
}

function Divider() {
  return <div className="w-px h-6 bg-[#D6A34A]/30 mx-1" />;
}

function ErrorMessage({ message, onRetry, compact = false }: { message: string; onRetry: () => void; compact?: boolean }) {
  return (
    <div className="text-center max-w-md mx-auto">
      <AlertTriangle size={compact ? 28 : 40} className="text-red-400 mx-auto mb-3" />
      <p className="text-white font-bold">Viewer 360 Gagal Dimuat</p>
      <p className="text-white/60 text-xs mt-2 break-words">{message}</p>
      <button type="button" onClick={onRetry} className="mt-4 bg-[#D6A34A] text-black px-5 py-2 rounded-lg text-xs font-bold">Coba Muat Ulang</button>
    </div>
  );
}

function NavigationGuide({ onClose }: { onClose: () => void }) {
  const items = [
    [MousePointer2, "Klik & Geser", "Tahan klik kiri dan geser mouse untuk melihat sekeliling."],
    [Move, "Sentuh Layar", "Geser layar menggunakan jari pada smartphone."],
    [ZoomIn, "Scroll / Cubit", "Gunakan scroll mouse atau cubit layar untuk zoom."],
  ] as const;
  return (
    <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-[#111]/95 border border-[#D6A34A]/30 rounded-3xl p-8 max-w-2xl w-full text-center relative" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={24} /></button>
        <h3 className="text-2xl font-bold text-white mb-8">Panduan Navigasi <span className="text-[#D6A34A]">360°</span></h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {items.map(([Icon, title, text]) => (
            <div key={title} className="flex flex-col items-center text-gray-300">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-[#D6A34A]"><Icon size={32} /></div>
              <p className="font-bold text-white mb-1">{title}</p>
              <p className="text-xs">{text}</p>
            </div>
          ))}
        </div>
        <button type="button" onClick={onClose} className="mt-10 px-8 py-3 bg-[#D6A34A] text-black font-bold rounded-full">Mengerti</button>
      </div>
    </div>
  );
}
