import { NO_INDEX } from "@/lib/seo";
export const metadata = NO_INDEX;
export const runtime = "edge";

export default function ProfilLayout({ children }: { children: React.ReactNode }) {
  return children;
}
