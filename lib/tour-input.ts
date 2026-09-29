export function isTourId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function readTourCoordinates(formData: FormData) {
  const rawPitch = formData.get("pitch") ?? formData.get("initialPitch");
  const rawYaw = formData.get("yaw") ?? formData.get("initialYaw");
  // Number(null) and Number("") are zero, but an uncaptured point is not (0, 0).
  if (typeof rawPitch !== "string" || typeof rawYaw !== "string" || !rawPitch.trim() || !rawYaw.trim()) {
    return null;
  }
  const pitch = Number(rawPitch);
  const yaw = Number(rawYaw);
  if (!Number.isFinite(pitch) || !Number.isFinite(yaw) || pitch < -90 || pitch > 90 || yaw < -180 || yaw > 180) {
    return null;
  }
  return { pitch, yaw };
}
