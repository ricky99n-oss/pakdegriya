export default function Tour360Styles() {
  return (
    <style>{`
      .pakde-editor-hotspot, .pakde-scene-hotspot {
        background-image:none !important; background:none !important;
      }
      .pakde-hotspot-wrapper {
        position:absolute; z-index:20; cursor:pointer; display:flex;
        align-items:center; justify-content:center; width:50px; height:50px;
        margin-left:-25px; margin-top:-25px;
      }
      .pakde-hotspot-dot {
        width:44px; height:44px; border-radius:999px;
        border:3px solid rgba(255,255,255,.82); background:rgba(0,0,0,.55);
        display:flex; align-items:center; justify-content:center; color:#fff;
        box-shadow:0 4px 12px rgba(0,0,0,.5); transition:.25s ease;
      }
      .pakde-hotspot-thumbnail {
        width:60px; height:60px; border-radius:999px;
        border:3px solid rgba(255,255,255,.9); background-size:cover;
        background-position:center; box-shadow:0 4px 15px rgba(0,0,0,.6);
        transition:.25s ease; margin-left:-5px; margin-top:-5px;
      }
      .pakde-hotspot-wrapper:hover .pakde-hotspot-dot,
      .pakde-hotspot-wrapper:hover .pakde-hotspot-thumbnail {
        transform:scale(1.12); border-color:#D6A34A;
      }
      .pakde-hotspot-animated .pakde-hotspot-dot {
        animation:pakde-float-pulse 3s infinite ease-in-out;
      }
      .pakde-hotspot-animated:hover .pakde-hotspot-dot { animation:none; }
      .door-icon { display:flex; align-items:center; justify-content:center; }
      .door-label {
        position:absolute; bottom:100%; left:50%; margin-bottom:10px;
        transform:translateX(-50%) translateY(8px); background:rgba(0,0,0,.82);
        color:#fff; padding:6px 12px; border-radius:8px; font-size:12px;
        font-weight:700; white-space:nowrap; opacity:0; pointer-events:none;
        transition:.25s ease; border:1px solid rgba(255,255,255,.18);
        box-shadow:0 4px 12px rgba(0,0,0,.3);
      }
      .pakde-hotspot-wrapper:hover .door-label {
        opacity:1; transform:translateX(-50%) translateY(0);
      }
      #tour-canvas-admin, #public-tour-container,
      #tour-canvas-admin .pnlm-container, #public-tour-container .pnlm-container {
        width:100%; height:100%; background:#000;
      }
      #tour-canvas-admin canvas, #public-tour-container canvas { display:block; }

      /* Loader bawaan Pannellum diganti loader Pakde Griya agar lebih modern. */
      #public-tour-container .pnlm-load-box,
      #public-tour-container .pnlm-lbox,
      #public-tour-container .pnlm-loading,
      #public-tour-container .pnlm-loading-box {
        display:none !important;
      }

      .planet-intro-image {
        animation:pakde-spin-planet 70s linear infinite;
        will-change:transform;
      }
      @keyframes pakde-float-pulse {
        0%,100% { box-shadow:0 0 0 0 rgba(255,255,255,.4); transform:translateY(0); }
        50% { box-shadow:0 0 0 10px rgba(255,255,255,0); transform:translateY(-5px); }
      }
      @keyframes pakde-spin-planet {
        from { transform:rotate(0deg); }
        to { transform:rotate(360deg); }
      }

      @media (max-width:768px) {
        .door-label {
          opacity:1; transform:translateX(-50%); font-size:10px;
          padding:4px 8px; margin-bottom:5px; max-width:130px;
          overflow:hidden; text-overflow:ellipsis;
        }
        .pakde-hotspot-dot { width:40px; height:40px; }
        .pakde-hotspot-thumbnail { width:52px; height:52px; }
      }

      @media (prefers-reduced-motion:reduce) {
        .planet-intro-image, .pakde-hotspot-animated .pakde-hotspot-dot {
          animation:none !important;
        }
      }
    `}</style>
  );
}
