"use client";

import ActionForm from "./ActionForm";
import { setPublishStatus } from "@/lib/property-client";

export default function PropertyPublishForm({ children }: { children: React.ReactNode }) {
  return <ActionForm action={setPublishStatus}>{children}</ActionForm>;
}
