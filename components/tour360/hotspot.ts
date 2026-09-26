import type { HotspotIconType } from "./types";

const ARROW_SVG = `
<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <polyline points="18 15 12 9 6 15"></polyline>
</svg>`;

const DOOR_SVG = `
<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M18 3a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12z"></path>
  <path d="M10 9v6"></path>
  <path d="M14 9v6"></path>
</svg>`;

export function parseHotspotLabel(value?: string | null): {
  label: string;
  iconType: HotspotIconType;
} {
  const [label = "", rawIcon = "door"] = (value || "").split("|||");
  const iconType: HotspotIconType =
    rawIcon === "arrow" || rawIcon === "thumbnail" ? rawIcon : "door";
  return { label, iconType };
}

export function renderTourHotspot(
  hotSpotDiv: HTMLElement,
  args: { label?: string; iconType?: HotspotIconType; targetImage?: string; animated?: boolean }
) {
  const { label = "Menuju Ruangan", iconType = "door", targetImage, animated } = args;

  hotSpotDiv.replaceChildren();
  hotSpotDiv.classList.add("pakde-hotspot-wrapper");
  if (animated) hotSpotDiv.classList.add("pakde-hotspot-animated");

  const dot = document.createElement("div");

  if (iconType === "thumbnail" && targetImage) {
    dot.classList.add("pakde-hotspot-thumbnail");
    dot.style.backgroundImage = `url("${targetImage.replace(/"/g, "%22")}")`;
  } else {
    dot.classList.add("pakde-hotspot-dot");
    const icon = document.createElement("span");
    icon.classList.add("door-icon");
    icon.innerHTML = iconType === "arrow" ? ARROW_SVG : DOOR_SVG;
    dot.appendChild(icon);
  }

  const text = document.createElement("div");
  text.classList.add("door-label");
  text.textContent = label;

  hotSpotDiv.append(dot, text);
}

export function errorMessage(error: unknown, fallback = "Viewer 360 gagal dimuat.") {
  if (typeof error === "string" && error.trim()) return error;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
