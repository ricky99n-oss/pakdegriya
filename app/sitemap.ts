import { buildSitemap } from "@/lib/sitemap";
export const runtime = "edge";
export const dynamic = "force-dynamic";
export default async function sitemap() { return buildSitemap(); }
