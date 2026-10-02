import { readFile, rm } from "node:fs/promises";

// Run only after `next build` succeeds (the build script uses &&).
// Next's prerender step creates export-detail.json temporarily and removes it
// for server builds. With Next 16.3's Webpack tracing it can remain in .next,
// causing the Pages adapter's Vercel builder to mistake this SSR app for an
// incomplete static export. Preserve the marker for real static exports.
const { config } = JSON.parse(
  await readFile(new URL("../.next/required-server-files.json", import.meta.url), "utf8"),
);

if (config.output !== "export") {
  // Require the completed build marker before cleaning any transient metadata.
  const buildId = await readFile(new URL("../.next/BUILD_ID", import.meta.url), "utf8");
  if (!buildId.trim()) throw new Error("Next.js build ID is missing");
  await rm(new URL("../.next/export-detail.json", import.meta.url), { force: true });
}
