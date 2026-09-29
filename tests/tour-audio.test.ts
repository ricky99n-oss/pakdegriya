import { describe, expect, it, vi } from "vitest";
import { createTourAudioController, resolveTourAudioId } from "@/lib/tour-audio";
class FakeAudio extends EventTarget {
  src = ""; paused = true; muted = false; loop = false; preload = ""; error = null;
  load = vi.fn();
  play = vi.fn(async () => { this.paused = false; });
  pause = vi.fn(() => { this.paused = true; this.dispatchEvent(new Event("pause")); });
  getAttribute() { return this.src; }
  removeAttribute() { this.src = ""; }
}
const setup = () => { const audio = new FakeAudio(); const notify = vi.fn(); return { audio, notify, controller: createTourAudioController(audio as unknown as HTMLAudioElement, notify) }; };
describe("tour audio", () => {
  it("uses the uploaded property audio by default and honors explicit selections/silence", () => {
    const media = [{ id: "image", file_type: "panorama_private" }, { id: "a", file_type: "audio_private" }, { id: "b", file_type: "audio_private" }];
    expect(resolveTourAudioId(null, media)).toBe("a"); expect(resolveTourAudioId("b", media)).toBe("b");
    expect(resolveTourAudioId("none", media)).toBe(null); expect(resolveTourAudioId("deleted", media)).toBe("a");
    expect(resolveTourAudioId(null, [])).toBe(null);
  });
  it("plays on a user gesture and supports mute/unmute without reloading the same track", async () => {
    const { audio, controller, notify } = setup();
    controller.play("/api/media/audio"); expect(audio.play).toHaveBeenCalledTimes(1);
    await Promise.resolve(); expect(notify).toHaveBeenLastCalledWith({ enabled: true, playing: true, error: "" });
    controller.stop(); expect(audio.paused).toBe(true); expect(controller.enabled).toBe(false);
    controller.play("/api/media/audio"); await Promise.resolve(); expect(audio.load).toHaveBeenCalledTimes(1);
    controller.destroy();
  });
  it("does not restart a background track when switching rooms using the same audio", async () => {
    const { audio, controller } = setup(); controller.play("a"); await Promise.resolve(); controller.play("a");
    expect(audio.load).toHaveBeenCalledTimes(1); controller.play("b"); expect(audio.load).toHaveBeenCalledTimes(2); controller.destroy();
  });
  it("ignores stale play completion after the user mutes", async () => {
    const { audio, controller, notify } = setup(); let finish!: () => void;
    audio.play.mockImplementationOnce(() => new Promise<void>((resolve) => { finish = resolve; }));
    controller.play("a"); controller.stop(); finish(); await Promise.resolve();
    expect(notify).toHaveBeenLastCalledWith({ enabled: false, playing: false, error: "" }); controller.destroy();
  });
  it("reports autoplay denial and lets the next click retry", async () => {
    const { audio, controller, notify } = setup(); audio.play.mockRejectedValueOnce(Object.assign(new Error("blocked"), { name: "NotAllowedError" }));
    controller.play("a"); await Promise.resolve(); await Promise.resolve();
    expect(controller.enabled).toBe(false); expect(notify).toHaveBeenLastCalledWith(expect.objectContaining({ error: expect.stringContaining("Browser menahan") }));
    controller.play("a"); await Promise.resolve(); expect(notify).toHaveBeenLastCalledWith(expect.objectContaining({ playing: true })); controller.destroy();
  });
  it("reports missing audio and media errors without silently ignoring clicks", () => {
    const { audio, controller, notify } = setup(); controller.play(null);
    expect(notify).toHaveBeenLastCalledWith(expect.objectContaining({ error: expect.stringContaining("belum memiliki") }));
    controller.play("a"); audio.dispatchEvent(new Event("error"));
    expect(notify).toHaveBeenLastCalledWith(expect.objectContaining({ playing: false, error: expect.stringContaining("gagal dimuat") })); controller.destroy();
  });
});
