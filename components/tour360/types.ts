export type HotspotIconType = "door" | "arrow" | "thumbnail";

export type PannellumViewer = {
  destroy: () => void;
  resize: () => void;
  isLoaded?: () => boolean;
  getPitch: () => number;
  getYaw: () => number;
  getHfov: () => number;
  setHfov: (hfov: number, animated?: boolean | number) => PannellumViewer;
  lookAt: (pitch?: number, yaw?: number, hfov?: number, animated?: boolean | number) => PannellumViewer;
  loadScene: (
    sceneId: string,
    pitch?: number | "same",
    yaw?: number | "same" | "sameAzimuth",
    hfov?: number | "same"
  ) => PannellumViewer;
  on: (event: string, listener: (...args: any[]) => void) => PannellumViewer;
  off?: (event?: string, listener?: (...args: any[]) => void) => PannellumViewer;
};

export type PannellumGlobal = {
  viewer: (container: HTMLElement | string, config: Record<string, any>) => PannellumViewer;
};

declare global {
  interface Window {
    pannellum?: PannellumGlobal;
  }
}

export type EditorScene = {
  id: string;
  name: string;
  mediaId: string;
  sortOrder?: number;
  initialPitch?: number | null;
  initialYaw?: number | null;
  isFirstScene?: boolean;
  audioMediaId?: string | null;
  [key: string]: any;
};

export type EditorHotspot = {
  id: string;
  sceneId: string;
  targetSceneId: string;
  pitch: number | string;
  yaw: number | string;
  label?: string | null;
  [key: string]: any;
};

export type PublicHotspot = {
  pitch: number | string;
  yaw: number | string;
  type?: string;
  text?: string;
  sceneId?: string;
  [key: string]: any;
};

export type PublicTourScene = {
  title: string;
  type?: "equirectangular" | "cubemap" | "multires";
  panorama: string;
  thumbnail?: string;
  pitch?: number;
  yaw?: number;
  hfov?: number;
  minHfov?: number;
  maxHfov?: number;
  customAudioUrl?: string | null;
  hotSpots?: PublicHotspot[];
  [key: string]: any;
};

export type PublicTourConfig = {
  default?: {
    firstScene?: string;
    sceneFadeDuration?: number;
    autoLoad?: boolean;
    [key: string]: any;
  };
  scenes: Record<string, PublicTourScene>;
};

export type CoordinateValue = number | "";
