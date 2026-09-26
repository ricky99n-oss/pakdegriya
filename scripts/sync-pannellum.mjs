import { copyFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const packageJson = require.resolve("pannellum/package.json");
const packageRoot = dirname(packageJson);
const source = join(packageRoot, "build");
const target = join(process.cwd(), "public", "vendor", "pannellum");

await mkdir(target, { recursive: true });
await Promise.all([
  copyFile(join(source, "pannellum.js"), join(target, "pannellum.js")),
  copyFile(join(source, "pannellum.css"), join(target, "pannellum.css")),
  copyFile(join(packageRoot, "COPYING"), join(target, "LICENSE-PANNELLUM")),
]);

console.log("Pannellum 2.5.x copied to public/vendor/pannellum");
