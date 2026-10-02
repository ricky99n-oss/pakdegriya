"use client";

import ActionForm from "@/components/admin/ActionForm";
import { createScene } from "@/lib/tour-client";

export default function CreateSceneForm({ children, className }: {
  children: React.ReactNode;
  className?: string;
}) {
  return <ActionForm action={createScene} className={className}>{children}</ActionForm>;
}
