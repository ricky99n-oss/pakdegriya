export function readPropertyFlags(formData: FormData) {
  const flags: { is_hot_item?: boolean; is_negotiable?: boolean } = {};
  for (const [field, column] of [["isHotItem", "is_hot_item"], ["isNegotiable", "is_negotiable"]] as const) {
    if (!formData.has(field)) continue;
    const value = formData.get(field);
    if (value !== "true" && value !== "false") throw new Error("Pengaturan Hot Item atau Nego tidak valid.");
    flags[column] = value === "true";
  }
  return flags;
}

export function isMissingPropertyFlags(error: { code?: string; message?: string } | null) {
  return Boolean(error && ["42703", "PGRST204"].includes(error.code || "")
    && /is_hot_item|is_negotiable/i.test(error.message || ""));
}

export const propertyFlagsSetupMessage = "Pengaturan Hot Item/Nego belum aktif di database. Jalankan pembaruan database Hot Item/Nego terlebih dahulu.";
