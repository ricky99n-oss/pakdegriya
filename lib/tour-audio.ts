export type AudioMedia = { id: string; file_type: string };
export function resolveTourAudioId(configured: string | null | undefined, media: AudioMedia[]) {
  if (configured === "none") return null;
  const audios = media.filter((item) => item.file_type === "audio_private");
  return audios.find((item) => item.id === configured)?.id || audios[0]?.id || null;
}
export type TourAudioState = { enabled: boolean; playing: boolean; error: string };
export function createTourAudioController(audio: HTMLAudioElement, notify: (state: TourAudioState) => void) {
  let enabled = false;
  let generation = 0;
  let disposed = false;
  const emit = (playing: boolean, error = "") => { if (!disposed) notify({ enabled, playing, error }); };
  audio.loop = true;
  audio.preload = "none";
  const onError = () => { enabled = false; generation++; emit(false, "Audio gagal dimuat. Klik tombol audio untuk mencoba lagi."); };
  const onPause = () => emit(false);
  const onPlaying = () => { if (enabled) emit(true); };
  audio.addEventListener("error", onError);
  audio.addEventListener("pause", onPause);
  audio.addEventListener("playing", onPlaying);
  return {
    get enabled() { return enabled; },
    play(source: string | null | undefined) {
      if (disposed) return;
      const current = ++generation;
      enabled = true;
      if (!source) {
        audio.pause(); audio.removeAttribute("src"); audio.load();
        emit(false, "Ruangan ini belum memiliki audio aktif.");
        return;
      }
      const sameSource = audio.getAttribute("src") === source;
      if (!sameSource || audio.error) {
        audio.pause(); audio.src = source; audio.load();
      }
      audio.muted = false;
      emit(!audio.paused);
      // Called synchronously from the user's click to retain autoplay permission.
      void audio.play().then(() => {
        if (current === generation && enabled) emit(true);
      }).catch((error: unknown) => {
        if (current !== generation || disposed) return;
        enabled = false;
        const blocked = error instanceof Error && error.name === "NotAllowedError";
        emit(false, blocked ? "Browser menahan audio. Klik tombol audio untuk memutar." : "Audio gagal diputar. Klik tombol audio untuk mencoba lagi.");
      });
    },
    stop() { enabled = false; generation++; audio.pause(); emit(false); },
    destroy() {
      disposed = true; enabled = false; generation++;
      audio.removeEventListener("error", onError); audio.removeEventListener("pause", onPause); audio.removeEventListener("playing", onPlaying);
      audio.pause(); audio.removeAttribute("src"); audio.load();
    },
  };
}
