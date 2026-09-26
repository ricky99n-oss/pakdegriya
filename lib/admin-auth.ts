import { validateRequest } from "@/lib/auth";

export async function requireAdmin() {
  const { user } = await validateRequest();

  if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
    throw new Error("UNAUTHORIZED");
  }

  return user;
}

export function adminActionErrorMessage(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return "Sesi admin tidak valid atau sudah berakhir. Silakan masuk kembali.";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Terjadi kesalahan server. Silakan coba lagi.";
}
