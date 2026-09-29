// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import TourViewerUI from "@/components/tour360/TourViewerUI";
afterEach(cleanup);
describe("viewer audio controls", () => {
  it("desktop and mobile audio buttons dispatch clicks and reflect the enabled state", () => {
    const toggle = vi.fn(); const noop = () => {};
    const props = { tourConfig: { scenes: { room: { title: "Fasad", panorama: "/panorama", customAudioUrl: "/audio" } } }, exitUrl: "/", currentSceneId: "room", started: true, loading: false, error: "", showTools: true, showGallery: false, showGuide: false, isFullscreen: false, isAudioPlaying: false, audioEnabled: false, audioError: "", onStart: noop, onRetry: noop, onToggleAudio: toggle, onToggleFullscreen: noop, onPrev: noop, onNext: noop, onScene: noop, setShowTools: noop, setShowGallery: noop, setShowGuide: noop };
    const { rerender } = render(<TourViewerUI {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Nyalakan suara" }));
    fireEvent.click(screen.getByRole("button", { name: "Audio" }));
    expect(toggle).toHaveBeenCalledTimes(2);
    rerender(<TourViewerUI {...props} audioEnabled isAudioPlaying />);
    fireEvent.click(screen.getByRole("button", { name: "Matikan suara" }));
    fireEvent.click(screen.getByRole("button", { name: "Mute" }));
    expect(toggle).toHaveBeenCalledTimes(4);
    rerender(<TourViewerUI {...props} audioError="Browser menahan audio" />);
    expect(screen.getByRole("status").textContent).toContain("Browser menahan audio");
  });
});
