"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Script from "next/script";

import {
  Crosshair,
  Target,
  Save,
  Trash2,
  Layers,
  Loader2,
  AlertTriangle,
} from "lucide-react";

import {
  createHotspotAction,
  deleteHotspotAction,
  updateSceneNameAction,
  deleteSceneAction,
  setFirstSceneAction,
  setInitialViewAction,
} from "@/app/admin/properti/[id]/tour/actions";

declare global {
  interface Window {
    pannellum: any;
  }
}

/*
 * =========================================================
 * CUSTOM HOTSPOT
 * =========================================================
 *
 * Diletakkan di luar component supaya function reference
 * tidak berubah setiap kali React melakukan render.
 */
function renderCustomHotspot(
  hotSpotDiv: HTMLElement,
  args: any
) {
  const {
    label,
    iconType,
    targetImage,
  } = args;

  hotSpotDiv.innerHTML = "";

  hotSpotDiv.classList.add(
    "pakde-hotspot-wrapper"
  );

  const dot =
    document.createElement("div");

  /*
   * Thumbnail
   */
  if (
    iconType === "thumbnail" &&
    targetImage
  ) {
    dot.classList.add(
      "pakde-hotspot-thumbnail"
    );

    dot.style.backgroundImage =
      `url("${targetImage}")`;
  }

  /*
   * Door / Arrow
   */
  else {
    dot.classList.add(
      "pakde-hotspot-dot"
    );

    const iconSpan =
      document.createElement("span");

    iconSpan.classList.add(
      "door-icon"
    );

    if (iconType === "arrow") {
      iconSpan.innerHTML = `
        <svg
          viewBox="0 0 24 24"
          width="24"
          height="24"
          stroke="currentColor"
          stroke-width="2.5"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
      `;
    } else {
      iconSpan.innerHTML = `
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          stroke="currentColor"
          stroke-width="2"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M18 3a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12z"></path>
          <path d="M10 9v6"></path>
          <path d="M14 9v6"></path>
        </svg>
      `;
    }

    dot.appendChild(iconSpan);
  }

  hotSpotDiv.appendChild(dot);

  /*
   * Label hotspot.
   *
   * Pakai textContent, bukan innerHTML,
   * supaya label dari database tidak
   * menjadi HTML yang tidak disengaja.
   */
  const labelDiv =
    document.createElement("div");

  labelDiv.classList.add(
    "door-label"
  );

  labelDiv.textContent =
    label || "Menuju Ruangan";

  hotSpotDiv.appendChild(labelDiv);
}

type TourEditorProps = {
  existingScenes: any[];
  propertyId: string;
  allHotspots: any[];
  availableAudios: any[];
};

export default function TourEditor({
  existingScenes,
  propertyId,
  allHotspots,
  availableAudios,
}: TourEditorProps) {
  /*
   * availableAudios masih dipertahankan
   * karena prop ini digunakan oleh parent
   * versi sekarang.
   */
  void availableAudios;

  const viewerRef =
    useRef<HTMLDivElement>(null);

  const viewerInstance =
    useRef<any>(null);

  const [isReady, setIsReady] =
    useState(false);

  const [
    isViewerLoading,
    setIsViewerLoading,
  ] = useState(true);

  const [
    viewerError,
    setViewerError,
  ] = useState("");

  const [
    activeSceneId,
    setActiveSceneId,
  ] = useState<string>(
    existingScenes.length > 0
      ? existingScenes[0].id
      : ""
  );

  const [
    pitch,
    setPitch,
  ] = useState<number | string>("");

  const [
    yaw,
    setYaw,
  ] = useState<number | string>("");

  /*
   * =========================================================
   * MEMOIZED DATA
   * =========================================================
   *
   * Sangat penting.
   *
   * Di kode lama:
   *
   * const sceneHotspots =
   *   allHotspots.filter(...)
   *
   * menghasilkan ARRAY BARU setiap React render.
   *
   * Karena sceneHotspots masuk dependency useEffect,
   * Pannellum bisa destroy -> init -> destroy -> init
   * setiap pitch / yaw berubah.
   *
   * Itu salah satu penyebab viewer terasa blank /
   * unstable.
   */

  const currentScene = useMemo(
    () =>
      existingScenes.find(
        (scene) =>
          scene.id === activeSceneId
      ),
    [
      existingScenes,
      activeSceneId,
    ]
  );

  const sceneHotspots = useMemo(
    () =>
      allHotspots.filter(
        (hotspot) =>
          hotspot.sceneId ===
          activeSceneId
      ),
    [
      allHotspots,
      activeSceneId,
    ]
  );

  /*
   * Convert hotspot database
   * menjadi hotspot Pannellum.
   */
  const mappedHotspots = useMemo(
    () =>
      sceneHotspots.map(
        (hotspot) => {
          const [
            rawLabel,
            iconType = "door",
          ] = (
            hotspot.label || ""
          ).split("|||");

          const targetScene =
            existingScenes.find(
              (scene) =>
                scene.id ===
                hotspot.targetSceneId
            );

          const targetImage =
            targetScene?.mediaId
              ? `/api/media/${targetScene.mediaId}`
              : "";

          return {
            pitch:
              Number(hotspot.pitch) ||
              0,

            yaw:
              Number(hotspot.yaw) ||
              0,

            type: "custom",

            createTooltipFunc:
              renderCustomHotspot,

            createTooltipArgs: {
              label:
                rawLabel ||
                targetScene?.name ||
                "Menuju Ruangan",

              iconType,

              targetImage,
            },
          };
        }
      ),
    [
      sceneHotspots,
      existingScenes,
    ]
  );

  /*
   * =========================================================
   * PANNELLUM INIT
   * =========================================================
   */
  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!viewerRef.current) {
      return;
    }

    if (!window.pannellum) {
      return;
    }

    if (!currentScene?.mediaId) {
      return;
    }

    /*
     * Reset UI.
     */
    setViewerError("");
    setIsViewerLoading(true);

    /*
     * Hancurkan instance sebelumnya
     * sebelum membuat viewer baru.
     */
    if (viewerInstance.current) {
      try {
        viewerInstance.current.destroy();
      } catch {
        // abaikan error destroy
      }

      viewerInstance.current = null;
    }

    const panoramaUrl =
      `/api/media/${currentScene.mediaId}`;

    let viewer: any = null;

    try {
      /*
       * =====================================================
       * PENTING
       * =====================================================
       *
       * Tidak memakai:
       *
       * ?buffer=true
       * fetch -> blob
       * arrayBuffer
       * dynamic:true
       *
       * Panorama langsung dibaca Pannellum
       * dari endpoint streaming R2.
       */
      viewer =
        window.pannellum.viewer(
          "tour-canvas-admin",
          {
            type:
              "equirectangular",

            panorama:
              panoramaUrl,

            autoLoad: true,

            /*
             * Initial view yang disimpan
             * oleh admin.
             */
            pitch:
              Number(
                currentScene.initialPitch ??
                  0
              ),

            yaw:
              Number(
                currentScene.initialYaw ??
                  0
              ),

            hfov: 90,
            minHfov: 40,
            maxHfov: 120,

            compass: false,

            showControls: true,

            /*
             * Walaupun endpoint kita
             * same-origin, tetap aman
             * disiapkan untuk WebGL.
             */
            crossOrigin:
              "anonymous",

            /*
             * Background canvas.
             */
            backgroundColor: [
              0,
              0,
              0,
            ],

            hotSpots:
              mappedHotspots,
          }
        );

      viewerInstance.current =
        viewer;

      /*
       * Viewer berhasil load.
       */
      if (
        typeof viewer.on ===
        "function"
      ) {
        viewer.on(
          "load",
          () => {
            setIsViewerLoading(
              false
            );

            setViewerError("");
          }
        );

        /*
         * Pannellum error event.
         */
        viewer.on(
          "error",
          (error: any) => {
            console.error(
              "Pannellum error:",
              error
            );

            setIsViewerLoading(
              false
            );

            setViewerError(
              typeof error ===
                "string"
                ? error
                : "Panorama gagal dimuat."
            );
          }
        );
      }
    } catch (error) {
      console.error(
        "Pannellum gagal diinisialisasi:",
        error
      );

      setIsViewerLoading(false);

      setViewerError(
        error instanceof Error
          ? error.message
          : "Viewer 360 gagal diinisialisasi."
      );
    }

    /*
     * Cleanup hanya ketika:
     *
     * - pindah ruangan
     * - data hotspot berubah
     * - component unmount
     */
    return () => {
      if (viewer) {
        try {
          viewer.destroy();
        } catch {
          // abaikan
        }
      }

      if (
        viewerInstance.current ===
        viewer
      ) {
        viewerInstance.current =
          null;
      }
    };
  }, [
    isReady,
    currentScene?.id,
    currentScene?.mediaId,
    currentScene?.initialPitch,
    currentScene?.initialYaw,
    mappedHotspots,
  ]);

  /*
   * =========================================================
   * CAPTURE PITCH + YAW
   * =========================================================
   */
  const handleCaptureCoords =
    () => {
      if (
        !viewerInstance.current
      ) {
        return;
      }

      try {
        const currentPitch =
          viewerInstance.current.getPitch();

        const currentYaw =
          viewerInstance.current.getYaw();

        setPitch(
          Number(currentPitch)
        );

        setYaw(
          Number(currentYaw)
        );
      } catch (error) {
        console.error(
          "Gagal mengambil koordinat:",
          error
        );
      }
    };

  /*
   * =========================================================
   * CREATE HOTSPOT
   * =========================================================
   */
  const handleHotspotSubmit =
    async (
      formData: FormData
    ) => {
      const label =
        formData.get(
          "label"
        ) as string;

      const iconType =
        formData.get(
          "iconType"
        ) as string;

      /*
       * Format lama tetap dipertahankan:
       *
       * Label|||iconType
       */
      formData.set(
        "label",
        `${label}|||${iconType}`
      );

      await createHotspotAction(
        formData
      );

      setPitch("");
      setYaw("");
    };

  /*
   * =========================================================
   * CHANGE SCENE
   * =========================================================
   */
  const gantiRuangan = (
    id: string
  ) => {
    if (id === activeSceneId) {
      return;
    }

    setViewerError("");
    setIsViewerLoading(true);

    setPitch("");
    setYaw("");

    setActiveSceneId(id);
  };

  /*
   * Tidak ada scene.
   */
  if (
    existingScenes.length === 0
  ) {
    return (
      <div className="bg-white border border-[#D6A34A]/20 rounded-2xl p-8 text-center">
        <p className="font-bold text-[#4A2F1B]">
          Belum ada ruangan 360°
        </p>

        <p className="text-sm text-gray-500 mt-2">
          Upload panorama terlebih
          dahulu untuk menggunakan
          editor virtual tour.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/*
       * ===============================================
       * PANNELLUM CSS
       * ===============================================
       */}
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css"
      />

      {/*
       * ===============================================
       * CUSTOM HOTSPOT CSS
       * ===============================================
       */}
      <style>{`
        .pakde-hotspot-wrapper {
          position: absolute;
          z-index: 2;
          cursor: pointer;

          display: flex;
          align-items: center;
          justify-content: center;

          width: 50px;
          height: 50px;

          margin-left: -25px;
          margin-top: -25px;
        }

        .pakde-hotspot-dot {
          width: 44px;
          height: 44px;

          border-radius: 50%;

          border: 3px solid rgba(255,255,255,0.8);

          background: rgba(0,0,0,0.5);

          display: flex;
          align-items: center;
          justify-content: center;

          color: white;

          box-shadow:
            0 4px 10px
            rgba(0,0,0,0.5);

          transition:
            all 0.3s ease;
        }

        .pakde-hotspot-thumbnail {
          width: 60px;
          height: 60px;

          border-radius: 50%;

          border:
            3px solid
            rgba(255,255,255,0.9);

          background-size: cover;
          background-position: center;

          box-shadow:
            0 4px 15px
            rgba(0,0,0,0.6);

          transition:
            all 0.3s ease;

          margin-left: -5px;
          margin-top: -5px;
        }

        .pakde-hotspot-wrapper:hover
        .pakde-hotspot-dot,
        .pakde-hotspot-wrapper:hover
        .pakde-hotspot-thumbnail {
          transform: scale(1.15);

          border-color:
            #D6A34A;
        }

        .door-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .door-label {
          position: absolute;

          bottom: 100%;

          margin-bottom: 10px;

          left: 50%;

          transform:
            translateX(-50%);

          background:
            rgba(0,0,0,0.82);

          color: white;

          padding:
            6px 14px;

          border-radius:
            8px;

          font-size:
            13px;

          font-weight:
            600;

          white-space:
            nowrap;

          box-shadow:
            0 4px 12px
            rgba(0,0,0,0.3);

          border:
            1px solid
            rgba(255,255,255,0.2);

          pointer-events:
            none;
        }

        #tour-canvas-admin {
          width: 100%;
          height: 100%;
          background: #000;
        }

        #tour-canvas-admin
        .pnlm-container {
          width: 100%;
          height: 100%;
        }

        #tour-canvas-admin
        canvas {
          display: block;
        }
      `}</style>

      {/*
       * ===============================================
       * PANNELLUM JS
       * ===============================================
       *
       * onReady dipakai agar script yang sudah
       * pernah dimuat saat Next navigation
       * tetap memicu isReady.
       */}
      <Script
        src="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js"
        strategy="afterInteractive"
        onLoad={() =>
          setIsReady(true)
        }
        onReady={() =>
          setIsReady(true)
        }
        onError={() => {
          setIsReady(false);

          setIsViewerLoading(
            false
          );

          setViewerError(
            "Library Pannellum gagal dimuat dari CDN."
          );
        }}
      />

      {/*
       * ===============================================
       * PILIH RUANGAN
       * ===============================================
       */}
      <div className="flex flex-wrap gap-2 bg-white p-4 rounded-2xl shadow-sm border border-[#D6A34A]/20 items-center">
        <span className="text-xs font-bold text-[#4A2F1B] flex items-center gap-1.5 mr-2">
          <Layers
            size={16}
            className="text-[#D6A34A]"
          />

          Pilih Ruangan:
        </span>

        {existingScenes.map(
          (scene, idx) => (
            <button
              type="button"
              key={scene.id}
              onClick={() =>
                gantiRuangan(
                  scene.id
                )
              }
              className={`
                px-4
                py-2
                rounded-xl
                text-xs
                font-bold
                transition-all
                shadow-sm

                ${
                  activeSceneId ===
                  scene.id
                    ? `
                      bg-[#4A2F1B]
                      text-[#D6A34A]
                      border
                      border-[#D6A34A]
                    `
                    : `
                      bg-[#FFF7E8]
                      text-[#4A2F1B]
                      hover:bg-[#D6A34A]/20
                      border
                      border-[#D6A34A]/30
                    `
                }
              `}
            >
              {idx + 1}.{" "}
              {scene.name}
            </button>
          )
        )}
      </div>

      {currentScene && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#D6A34A]/20">
          {/*
           * ===========================================
           * HEADER SCENE
           * ===========================================
           */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b-2 border-[#D6A34A]/30 pb-4 mb-6">
            <div className="space-y-3">
              {/*
               * Rename Scene
               */}
              <form
                action={
                  updateSceneNameAction
                }
                className="flex flex-wrap items-center gap-3"
              >
                <input
                  type="hidden"
                  name="sceneId"
                  value={
                    currentScene.id
                  }
                />

                <input
                  type="hidden"
                  name="propertyId"
                  value={
                    propertyId
                  }
                />

                <span className="text-xl font-black text-[#4A2F1B]">
                  Ruangan Aktif:
                </span>

                <input
                  type="text"
                  name="name"
                  defaultValue={
                    currentScene.name
                  }
                  className="
                    text-xl
                    font-black
                    text-[#D6A34A]
                    bg-transparent
                    border-b
                    border-dashed
                    border-[#D6A34A]
                    focus:outline-none
                    focus:border-solid
                    hover:bg-[#FFF7E8]
                    px-1
                    rounded
                    transition-colors
                    w-48
                    md:w-64
                  "
                />

                <button
                  type="submit"
                  className="
                    text-xs
                    bg-[#FFF7E8]
                    text-[#4A2F1B]
                    px-3
                    py-1.5
                    rounded-lg
                    border
                    border-[#D6A34A]/30
                    hover:bg-[#D6A34A]
                    font-bold
                    transition-colors
                  "
                >
                  Simpan Nama
                </button>
              </form>

              {/*
               * First Scene
               */}
              <form
                action={
                  setFirstSceneAction
                }
              >
                <input
                  type="hidden"
                  name="sceneId"
                  value={
                    currentScene.id
                  }
                />

                <input
                  type="hidden"
                  name="propertyId"
                  value={
                    propertyId
                  }
                />

                <button
                  type="submit"
                  className={`
                    text-xs
                    px-4
                    py-2
                    rounded-lg
                    font-bold
                    transition-colors

                    ${
                      currentScene.isFirstScene
                        ? `
                          bg-green-100
                          text-green-700
                          border
                          border-green-300
                        `
                        : `
                          bg-gray-100
                          text-gray-600
                          hover:bg-gray-200
                          border
                          border-gray-200
                        `
                    }
                  `}
                >
                  {currentScene.isFirstScene
                    ? "★ Ruangan Ini Tampil Pertama"
                    : "Jadikan Ruangan Pertama Muncul"}
                </button>
              </form>
            </div>

            {/*
             * Delete Scene
             */}
            <form
              action={
                deleteSceneAction
              }
            >
              <input
                type="hidden"
                name="sceneId"
                value={
                  currentScene.id
                }
              />

              <input
                type="hidden"
                name="propertyId"
                value={propertyId}
              />

              <button
                type="submit"
                className="
                  text-red-600
                  bg-red-50
                  px-3
                  py-1.5
                  rounded-lg
                  text-xs
                  font-bold
                  hover:bg-red-100
                  transition-colors
                "
              >
                Hapus Ruangan Ini
              </button>
            </form>
          </div>

          {/*
           * ===========================================
           * MAIN AREA
           * ===========================================
           */}
          <div className="flex flex-col xl:flex-row gap-6">
            {/*
             * =========================================
             * 360 VIEWER
             * =========================================
             */}
            <div
              className="
                w-full
                xl:w-2/3
                h-[500px]
                relative
                bg-black
                rounded-xl
                overflow-hidden
                shadow-inner
                border-2
                border-gray-200
              "
            >
              {/*
               * Loading
               */}
              {isViewerLoading &&
                !viewerError && (
                  <div className="absolute inset-0 z-20 bg-black flex flex-col items-center justify-center text-white">
                    <Loader2
                      size={36}
                      className="animate-spin text-[#D6A34A] mb-3"
                    />

                    <p className="font-bold text-sm">
                      Memuat Panorama
                      360°
                    </p>

                    <p className="text-xs text-white/50 mt-1">
                      Streaming dari
                      Cloudflare R2...
                    </p>
                  </div>
                )}

              {/*
               * Error
               */}
              {viewerError && (
                <div className="absolute inset-0 z-30 bg-black/95 flex items-center justify-center p-8">
                  <div className="text-center max-w-md">
                    <AlertTriangle
                      size={38}
                      className="text-red-400 mx-auto mb-3"
                    />

                    <p className="text-white font-bold">
                      Viewer 360 Gagal
                      Dimuat
                    </p>

                    <p className="text-white/60 text-xs mt-2 break-words">
                      {viewerError}
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setViewerError(
                          ""
                        );

                        setIsViewerLoading(
                          true
                        );

                        /*
                         * Memaksa recreate
                         * scene dengan set ID
                         * sementara.
                         */
                        const sceneId =
                          activeSceneId;

                        setActiveSceneId(
                          ""
                        );

                        setTimeout(
                          () =>
                            setActiveSceneId(
                              sceneId
                            ),
                          50
                        );
                      }}
                      className="
                        mt-5
                        bg-[#D6A34A]
                        text-[#281C15]
                        px-5
                        py-2
                        rounded-lg
                        text-xs
                        font-bold
                      "
                    >
                      Coba Muat Ulang
                    </button>
                  </div>
                </div>
              )}

              {/*
               * Crosshair
               */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <Crosshair
                  className="text-[#D6A34A] drop-shadow-md"
                  size={40}
                  strokeWidth={2}
                />
              </div>

              {/*
               * Pannellum Container
               *
               * Jangan pakai key={activeSceneId}.
               * Kita sendiri yang destroy / create
               * instance Pannellum.
               */}
              <div
                id="tour-canvas-admin"
                ref={viewerRef}
                className="
                  w-full
                  h-full
                  cursor-crosshair
                  bg-black
                "
              />
            </div>

            {/*
             * =========================================
             * SIDEBAR
             * =========================================
             */}
            <div className="w-full xl:w-1/3 flex flex-col gap-4">
              <div className="bg-[#FFF7E8] p-5 rounded-xl border border-[#D6A34A]/30">
                <h3 className="text-lg font-bold text-[#4A2F1B] mb-2 flex items-center gap-2">
                  <Target
                    size={18}
                  />

                  Kunci Koordinat
                </h3>

                <p className="text-xs text-[#281C15]/70 mb-4">
                  Arahkan tanda
                  silang di layar ke
                  posisi yang tepat,
                  lalu klik tombol di
                  bawah.
                </p>

                {/*
                 * CAPTURE
                 */}
                <button
                  type="button"
                  onClick={
                    handleCaptureCoords
                  }
                  disabled={
                    isViewerLoading ||
                    !!viewerError
                  }
                  className="
                    w-full
                    bg-[#4A2F1B]
                    text-white
                    text-sm
                    font-bold
                    py-3
                    px-4
                    rounded-lg
                    hover:bg-[#281C15]
                    transition-all
                    shadow-md
                    mb-4
                    flex
                    justify-center
                    items-center
                    gap-2
                    disabled:opacity-50
                    disabled:cursor-not-allowed
                  "
                >
                  <Crosshair
                    size={16}
                  />

                  Tangkap Titik
                  Koordinat
                </button>

                {/*
                 * INITIAL VIEW
                 */}
                <form
                  action={
                    setInitialViewAction
                  }
                  className="mb-4 pb-4 border-b border-[#D6A34A]/30"
                >
                  <input
                    type="hidden"
                    name="sceneId"
                    value={
                      currentScene.id
                    }
                  />

                  <input
                    type="hidden"
                    name="propertyId"
                    value={
                      propertyId
                    }
                  />

                  <input
                    type="hidden"
                    name="pitch"
                    value={
                      pitch === ""
                        ? currentScene.initialPitch ||
                          0
                        : pitch
                    }
                  />

                  <input
                    type="hidden"
                    name="yaw"
                    value={
                      yaw === ""
                        ? currentScene.initialYaw ||
                          0
                        : yaw
                    }
                  />

                  <button
                    type="submit"
                    disabled={
                      pitch === ""
                    }
                    className="
                      w-full
                      text-xs
                      px-4
                      py-2.5
                      bg-blue-50
                      text-blue-700
                      border
                      border-blue-200
                      rounded-lg
                      font-bold
                      hover:bg-blue-200
                      transition-colors
                      disabled:opacity-50
                      disabled:cursor-not-allowed
                    "
                  >
                    Jadikan Pandangan
                    Awal Kamera
                  </button>
                </form>

                {/*
                 * CREATE HOTSPOT
                 */}
                <form
                  action={
                    handleHotspotSubmit
                  }
                  className="space-y-3"
                >
                  <input
                    type="hidden"
                    name="propertyId"
                    value={
                      propertyId
                    }
                  />

                  <input
                    type="hidden"
                    name="sceneId"
                    value={
                      currentScene.id
                    }
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">
                        PITCH
                        (Vertikal)
                      </label>

                      <input
                        type="text"
                        name="pitch"
                        value={
                          pitch !== ""
                            ? Number(
                                pitch
                              ).toFixed(
                                2
                              )
                            : ""
                        }
                        readOnly
                        className="
                          w-full
                          bg-white
                          border
                          border-gray-300
                          p-2.5
                          rounded-lg
                          text-sm
                          text-center
                          font-mono
                          text-gray-900
                          font-bold
                        "
                        placeholder="-"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">
                        YAW
                        (Horizontal)
                      </label>

                      <input
                        type="text"
                        name="yaw"
                        value={
                          yaw !== ""
                            ? Number(
                                yaw
                              ).toFixed(
                                2
                              )
                            : ""
                        }
                        readOnly
                        className="
                          w-full
                          bg-white
                          border
                          border-gray-300
                          p-2.5
                          rounded-lg
                          text-sm
                          text-center
                          font-mono
                          text-gray-900
                          font-bold
                        "
                        placeholder="-"
                      />
                    </div>
                  </div>

                  {/*
                   * ICON STYLE
                   */}
                  <div>
                    <label className="block text-xs font-bold text-[#281C15] mb-1">
                      Pilih Gaya Ikon
                    </label>

                    <select
                      name="iconType"
                      className="
                        w-full
                        border
                        border-[#D6A34A]/50
                        p-2.5
                        rounded-lg
                        bg-white
                        text-[#281C15]
                        text-sm
                        focus:outline-none
                        focus:ring-1
                        focus:ring-[#D6A34A]
                      "
                    >
                      <option value="door">
                        🚪 Ikon Pintu
                        Klasik
                      </option>

                      <option value="arrow">
                        ⬆️ Ikon Panah
                        Arah
                      </option>

                      <option value="thumbnail">
                        🖼️ Thumbnail Foto
                        Ruangan
                      </option>
                    </select>
                  </div>

                  {/*
                   * TARGET SCENE
                   */}
                  <div>
                    <label className="block text-xs font-bold text-[#281C15] mb-1">
                      Pilih Ruangan
                      Tujuan
                    </label>

                    <select
                      name="targetSceneId"
                      required
                      className="
                        w-full
                        border
                        border-[#D6A34A]/50
                        p-2.5
                        rounded-lg
                        bg-white
                        text-[#281C15]
                        text-sm
                        focus:outline-none
                        focus:ring-1
                        focus:ring-[#D6A34A]
                      "
                    >
                      <option value="">
                        -- Pilih Tujuan
                        --
                      </option>

                      {existingScenes
                        .filter(
                          (scene) =>
                            scene.id !==
                            currentScene.id
                        )
                        .map(
                          (
                            scene
                          ) => (
                            <option
                              key={
                                scene.id
                              }
                              value={
                                scene.id
                              }
                            >
                              {
                                scene.name
                              }
                            </option>
                          )
                        )}
                    </select>
                  </div>

                  {/*
                   * LABEL
                   */}
                  <div>
                    <label className="block text-xs font-bold text-[#281C15] mb-1">
                      Label Tombol
                    </label>

                    <input
                      type="text"
                      name="label"
                      required
                      className="
                        w-full
                        border
                        border-[#D6A34A]/50
                        p-2.5
                        rounded-lg
                        bg-white
                        text-[#281C15]
                        text-sm
                        focus:outline-none
                        focus:ring-1
                        focus:ring-[#D6A34A]
                      "
                      placeholder="Mis: Menuju Dapur..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={
                      pitch === ""
                    }
                    className="
                      w-full
                      flex
                      items-center
                      justify-center
                      gap-2
                      bg-[#D6A34A]
                      text-[#281C15]
                      font-bold
                      py-3
                      px-4
                      rounded-lg
                      hover:bg-[#c2913b]
                      transition-all
                      shadow-md
                      disabled:opacity-50
                      disabled:cursor-not-allowed
                      mt-2
                    "
                  >
                    <Save
                      size={16}
                    />

                    Simpan Titik
                    Hotspot
                  </button>
                </form>
              </div>

              {/*
               * =======================================
               * HOTSPOT LIST
               * =======================================
               */}
              <div className="bg-white p-5 rounded-xl border border-gray-200">
                <h3 className="text-sm font-bold text-[#4A2F1B] mb-3 border-b pb-2">
                  Daftar Hotspot (
                  {
                    sceneHotspots.length
                  }
                  )
                </h3>

                {sceneHotspots.length ===
                0 ? (
                  <p className="text-xs text-gray-400 italic">
                    Belum ada titik
                    yang dibuat di
                    ruangan ini.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {sceneHotspots.map(
                      (hotspot) => {
                        const [
                          realLabel,
                          iconType = "door",
                        ] = (
                          hotspot.label ||
                          ""
                        ).split(
                          "|||"
                        );

                        const targetSceneName =
                          existingScenes.find(
                            (
                              scene
                            ) =>
                              scene.id ===
                              hotspot.targetSceneId
                          )?.name ||
                          "Unknown";

                        return (
                          <div
                            key={
                              hotspot.id
                            }
                            className="
                              flex
                              items-center
                              justify-between
                              bg-gray-50
                              p-2.5
                              rounded-lg
                              border
                              border-gray-100
                              text-xs
                              shadow-sm
                              hover:border-[#D6A34A]/50
                              transition-colors
                            "
                          >
                            <div>
                              <p className="font-bold text-[#4A2F1B]">
                                {
                                  targetSceneName
                                }
                              </p>

                              <p className="text-[10px] text-gray-500 uppercase mt-0.5">
                                Style:{" "}
                                {
                                  iconType
                                }{" "}
                                |{" "}
                                {
                                  realLabel
                                }
                              </p>
                            </div>

                            <form
                              action={
                                deleteHotspotAction
                              }
                            >
                              <input
                                type="hidden"
                                name="hotspotId"
                                value={
                                  hotspot.id
                                }
                              />

                              <input
                                type="hidden"
                                name="propertyId"
                                value={
                                  propertyId
                                }
                              />

                              <button
                                type="submit"
                                className="
                                  text-red-500
                                  hover:text-white
                                  hover:bg-red-500
                                  p-1.5
                                  rounded-md
                                  transition-colors
                                "
                                title="Hapus Hotspot"
                              >
                                <Trash2
                                  size={
                                    14
                                  }
                                />
                              </button>
                            </form>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}