"use client";

import {
  AlertTriangle,
  ArrowLeftFromLine,
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
  Volume2,
  VolumeX,
  X,
  ZoomIn,
} from "lucide-react";
import type { PublicTourConfig } from "./types";

type Props = {
  tourConfig: PublicTourConfig;
  introPlanetUrl?: string;
  exitUrl: string;
  propertyTitle?: string;
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
  const sceneIds = Object.keys(props.tourConfig.scenes || {});
  const sceneTitle = props.tourConfig.scenes[props.currentSceneId]?.title || "Virtual Tour";
  const canStart = !props.loading && !props.error && !!props.currentSceneId;

  return (
    <>
      {!props.started && (
        <div className="absolute inset-0 z-[60] bg-[#080706] flex flex-col items-center justify-center overflow-hidden px-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(214,163,74,.12),transparent_55%)]" />

          <div className="relative z-10 w-full max-w-[760px] flex flex-col items-center text-center">
            <p className="text-[#D6A34A] text-xs md:text-sm font-black tracking-[.25em] uppercase mb-3">Pakde Griya • Virtual Tour</p>
            <h1 className="text-white text-xl md:text-3xl font-black mb-5 line-clamp-2">{props.propertyTitle || "Jelajahi Properti 360°"}</h1>

            {props.introPlanetUrl ? (
              <button
                type="button"
                disabled={!canStart}
                onClick={() => props.onStart(true)}
                className="group relative w-[min(72vw,62vh)] aspect-square rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-[#D6A34A]/70 disabled:cursor-wait"
                aria-label="Masuk ke Virtual Tour 360 derajat"
                title={canStart ? "Klik planet untuk masuk ke Virtual Tour" : "Menyiapkan panorama"}
              >
                <span className="absolute inset-[4%] rounded-full bg-black/30 blur-2xl scale-95" aria-hidden="true" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={props.introPlanetUrl}
                  alt="Little Planet properti, klik untuk memulai Virtual Tour 360 derajat"
                  className="planet-intro-image relative w-full h-full object-contain rounded-full drop-shadow-[0_20px_45px_rgba(0,0,0,.6)] group-hover:scale-[1.025] transition-transform"
                />
                <span className="absolute inset-0 rounded-full border border-[#D6A34A]/20 group-hover:border-[#D6A34A]/60 transition-colors" />
              </button>
            ) : (
              <button
                type="button"
                disabled={!canStart}
                onClick={() => props.onStart(true)}
                className="w-52 h-52 rounded-full border border-[#D6A34A]/40 bg-[#281C15] text-[#D6A34A] font-black text-xl shadow-2xl disabled:opacity-50"
              >
                Mulai 360°
              </button>
            )}

            <div className="mt-5 min-h-12 flex flex-col items-center justify-center">
              {props.loading && !props.error ? (
                <p className="text-white/60 text-xs md:text-sm flex items-center gap-2"><Loader2 size={15} className="animate-spin" /> Menyiapkan panorama resolusi penuh...</p>
              ) : props.error ? (
                <ErrorMessage message={props.error} onRetry={props.onRetry} compact />
              ) : (
                <p className="text-white/80 text-sm md:text-base font-bold animate-pulse">Klik planet untuk masuk</p>
              )}
            </div>
          </div>
        </div>
      )}

      {props.started && props.error && (
        <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center p-6">
          <ErrorMessage message={props.error} onRetry={props.onRetry} />
        </div>
      )}

      {props.started && (
        <>
          {/* Header mobile selalu terlihat agar user tahu sedang berada di viewer dan dapat keluar. */}
          <header className="md:hidden absolute top-0 inset-x-0 z-30 h-14 px-3 flex items-center justify-between gap-3 bg-black/70 backdrop-blur-xl border-b border-white/10 pt-[env(safe-area-inset-top)]">
            <div className="min-w-0 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#D6A34A] text-[#281C15] flex items-center justify-center font-black shrink-0">P</div>
              <div className="min-w-0 leading-tight">
                <p className="text-[10px] uppercase tracking-wider text-[#D6A34A] font-black">Pakde Griya</p>
                <p className="text-white text-sm font-bold truncate">{sceneTitle}</p>
              </div>
            </div>
            <a href={props.exitUrl} className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center border border-white/10" aria-label="Keluar dari Virtual Tour" title="Keluar dari Virtual Tour">
              <X size={20} />
            </a>
          </header>

          <div className="hidden md:block absolute top-6 left-6 z-20 pointer-events-none max-w-[65vw]">
            <p className="text-[#D6A34A] uppercase tracking-[.18em] text-[10px] font-black mb-1">Pakde Griya • Virtual Tour</p>
            <h1 className="text-white text-2xl lg:text-3xl font-black drop-shadow-lg truncate">{sceneTitle}</h1>
          </div>

          <a
            href={props.exitUrl}
            className="hidden md:flex absolute top-6 right-6 z-30 h-11 px-4 rounded-full bg-black/65 border border-white/15 text-white items-center gap-2 backdrop-blur-md hover:border-[#D6A34A]/60 hover:text-[#D6A34A] transition-colors text-xs font-black"
            aria-label="Keluar dari Virtual Tour"
            title="Keluar dari Virtual Tour"
          >
            <ArrowLeftFromLine size={17} /> Keluar Viewer
          </a>

          {/* Desktop side utilities */}
          <ViewerToolButton className="hidden md:flex absolute bottom-6 left-6" label="Panduan navigasi" onClick={() => props.setShowGuide(true)}>
            <Info size={21} />
          </ViewerToolButton>
          <ViewerToolButton className="hidden md:flex absolute bottom-6 right-6" label={props.isAudioPlaying ? "Matikan suara" : "Nyalakan suara"} onClick={props.onToggleAudio}>
            {props.isAudioPlaying ? <Volume2 size={21} /> : <VolumeX size={21} />}
          </ViewerToolButton>

          {/* Desktop main dock */}
          <div className={`hidden md:block absolute bottom-6 left-1/2 -translate-x-1/2 z-20 transition-all ${props.showTools ? "opacity-100" : "translate-y-24 opacity-0 pointer-events-none"}`}>
            <div className="bg-black/80 backdrop-blur-md border border-[#D6A34A]/30 rounded-full px-5 py-2.5 flex items-center gap-3 shadow-2xl">
              <ToolIcon label="Ruangan sebelumnya" onClick={props.onPrev}><ChevronLeft size={25} /></ToolIcon>
              <ToolIcon label="Pilih ruangan" onClick={() => props.setShowGallery(true)}><LayoutGrid size={21} /></ToolIcon>
              <Divider />
              <ToolIcon label="Sembunyikan toolbar" onClick={() => props.setShowTools(false)}><ChevronDown size={21} /></ToolIcon>
              <Divider />
              <ToolIcon label={props.isFullscreen ? "Keluar layar penuh" : "Layar penuh"} onClick={props.onToggleFullscreen}>{props.isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}</ToolIcon>
              <ToolIcon label="Ruangan berikutnya" onClick={props.onNext}><ChevronRight size={25} /></ToolIcon>
            </div>
          </div>

          {!props.showTools && (
            <button type="button" onClick={() => props.setShowTools(true)} className="hidden md:block absolute bottom-0 left-1/2 -translate-x-1/2 z-20 bg-black/80 text-[#D6A34A] px-6 py-1 rounded-t-xl border border-[#D6A34A]/30" aria-label="Tampilkan toolbar" title="Tampilkan toolbar">
              <ChevronUp size={24} />
            </button>
          )}

          {/* Mobile dock: satu baris, safe-area aware, tidak ada tombol yang menumpuk. */}
          <nav className="md:hidden absolute z-30 left-2 right-2 bottom-[max(.5rem,env(safe-area-inset-bottom))] h-14 rounded-2xl bg-black/82 border border-[#D6A34A]/30 backdrop-blur-xl shadow-2xl grid grid-cols-6 items-center px-1" aria-label="Kontrol Virtual Tour">
            <MobileTool label="Sebelumnya" onClick={props.onPrev}><ChevronLeft size={22} /></MobileTool>
            <MobileTool label="Ruangan" onClick={() => props.setShowGallery(true)}><LayoutGrid size={20} /></MobileTool>
            <MobileTool label="Panduan" onClick={() => props.setShowGuide(true)}><Info size={20} /></MobileTool>
            <MobileTool label={props.isAudioPlaying ? "Mute" : "Audio"} onClick={props.onToggleAudio}>{props.isAudioPlaying ? <Volume2 size={20} /> : <VolumeX size={20} />}</MobileTool>
            <MobileTool label="Fullscreen" onClick={props.onToggleFullscreen}>{props.isFullscreen ? <Minimize size={19} /> : <Maximize size={19} />}</MobileTool>
            <MobileTool label="Berikutnya" onClick={props.onNext}><ChevronRight size={22} /></MobileTool>
          </nav>

          {props.showGallery && (
            <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col p-4 md:p-10 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="max-w-6xl w-full mx-auto flex items-center justify-between mb-5 md:mb-8">
                <div>
                  <p className="text-[10px] uppercase tracking-[.2em] text-white/40 font-black">Virtual Tour</p>
                  <h3 className="text-xl md:text-2xl font-black text-[#D6A34A]">Pilih Ruangan</h3>
                </div>
                <button type="button" onClick={() => props.setShowGallery(false)} className="w-11 h-11 text-white bg-white/10 rounded-full flex items-center justify-center" aria-label="Tutup daftar ruangan" title="Tutup daftar ruangan"><X size={25} /></button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5 max-w-6xl w-full mx-auto overflow-y-auto overscroll-contain pb-4">
                {sceneIds.map((id) => {
                  const scene = props.tourConfig.scenes[id];
                  const active = id === props.currentSceneId;
                  return (
                    <button type="button" key={id} onClick={() => props.onScene(id)} className={`relative rounded-2xl overflow-hidden aspect-video border-2 bg-[#17120e] transition-all ${active ? "border-[#D6A34A] ring-2 ring-[#D6A34A]/20" : "border-white/10 hover:border-white/40"}`} aria-label={`Buka ruangan ${scene.title}`}>
                      {scene.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img loading="lazy" src={scene.thumbnail} alt={`Thumbnail panorama 360 ${scene.title}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#D6A34A]/60"><LayoutGrid size={32} /></div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                      <p className={`absolute inset-x-0 bottom-0 p-2.5 md:p-3 text-xs md:text-sm font-black truncate text-left ${active ? "text-[#D6A34A]" : "text-white"}`}>{scene.title}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {props.showGuide && <NavigationGuide onClose={() => props.setShowGuide(false)} />}
        </>
      )}
    </>
  );
}

function ToolIcon({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className="group relative text-[#D6A34A] hover:text-white hover:scale-110 transition-all p-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6A34A]">
      {children}
      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-3 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity whitespace-nowrap bg-black/90 border border-white/10 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg">{label}</span>
    </button>
  );
}

function ViewerToolButton({ label, onClick, children, className = "" }: { label: string; onClick: () => void; children: React.ReactNode; className?: string }) {
  return <button type="button" onClick={onClick} aria-label={label} title={label} className={`${className} z-20 w-12 h-12 rounded-full bg-black/60 border border-[#D6A34A]/50 text-[#D6A34A] items-center justify-center backdrop-blur-md hover:scale-110 transition-all`}>{children}</button>;
}

function MobileTool({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className="h-12 min-w-0 text-[#D6A34A] flex flex-col items-center justify-center gap-0.5 rounded-xl active:bg-white/10">
      {children}<span className="text-[8px] leading-none font-bold truncate max-w-full px-0.5">{label}</span>
    </button>
  );
}

function Divider() { return <div className="w-px h-6 bg-[#D6A34A]/30 mx-1" />; }

function ErrorMessage({ message, onRetry, compact = false }: { message: string; onRetry: () => void; compact?: boolean }) {
  return (
    <div className="text-center max-w-md mx-auto">
      <AlertTriangle size={compact ? 25 : 40} className="text-red-400 mx-auto mb-2" />
      <p className="text-white font-bold text-sm">Viewer 360 Gagal Dimuat</p>
      <p className="text-white/60 text-xs mt-1 break-words">{message}</p>
      <button type="button" onClick={onRetry} className="mt-3 bg-[#D6A34A] text-black px-5 py-2 rounded-lg text-xs font-bold">Coba Muat Ulang</button>
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
    <div className="absolute inset-0 z-[70] bg-black/75 backdrop-blur-sm flex items-center justify-center p-5" onClick={onClose}>
      <div className="bg-[#111]/95 border border-[#D6A34A]/30 rounded-3xl p-6 md:p-8 max-w-2xl w-full text-center relative" onClick={(event) => event.stopPropagation()}>
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white" aria-label="Tutup panduan"><X size={24} /></button>
        <h3 className="text-xl md:text-2xl font-bold text-white mb-6">Panduan Navigasi <span className="text-[#D6A34A]">360°</span></h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8">
          {items.map(([Icon, title, text]) => <div key={title} className="flex md:flex-col items-center text-left md:text-center text-gray-300 gap-4 md:gap-0"><div className="w-12 h-12 md:w-16 md:h-16 shrink-0 rounded-full bg-white/5 flex items-center justify-center md:mb-4 text-[#D6A34A]"><Icon size={27} /></div><div><p className="font-bold text-white mb-1">{title}</p><p className="text-xs">{text}</p></div></div>)}
        </div>
        <button type="button" onClick={onClose} className="mt-7 px-8 py-3 bg-[#D6A34A] text-black font-bold rounded-full">Mengerti</button>
      </div>
    </div>
  );
}
