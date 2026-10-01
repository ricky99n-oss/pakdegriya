"use client";

import ActionForm from "./ActionForm";
import { updateProperty } from "@/lib/property-client";

export default function PropertyDetailsForm({ children }: { children: React.ReactNode }) {
  return <ActionForm action={updateProperty} className="space-y-4">{children}</ActionForm>;
}
