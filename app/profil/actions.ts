"use server";

import { cookies } from "next/headers";
import { validateRequest } from "@/lib/auth";
import { updateAuthUserWithAccessToken } from "@/lib/supabase";
import { updateUserProfileById } from "@/lib/user-profile";

function normalizePhone(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;
  else if (digits.startsWith("8")) digits = `62${digits}`;
  if (!/^62\d{8,13}$/.test(digits)) return null;
  return `+${digits}`;
}

export async function updateMemberProfileAction(formData: FormData) {
  try {
    const { user } = await validateRequest();
    if (!user) return { success: false, error: "Sesi login berakhir. Silakan login kembali." };

    const name = String(formData.get("name") || "").trim().slice(0, 120);
    const phone = normalizePhone(String(formData.get("phone") || ""));
    const requestedEmail = String(formData.get("email") || "").trim().toLowerCase();
    if (!name || !phone || !requestedEmail || !requestedEmail.includes("@")) {
      return { success: false, error: "Nama, nomor WhatsApp, dan email harus diisi dengan benar." };
    }

    const cookieStore = await cookies();
    const accessToken = cookieStore.get("supabase_access_token")?.value;
    if (!accessToken) return { success: false, error: "Sesi login berakhir. Silakan login kembali." };

    await updateUserProfileById(user.id, { name, phone });

    const emailChanged = requestedEmail !== String(user.email || "").toLowerCase();
    await updateAuthUserWithAccessToken(accessToken, {
      ...(emailChanged ? { email: requestedEmail } : {}),
      data: { full_name: name, phone },
    });

    return {
      success: true,
      emailVerificationSent: emailChanged,
      message: emailChanged
        ? "Profil disimpan. Kami mengirim verifikasi ke email baru. Email akun berubah setelah tautan verifikasi dikonfirmasi."
        : "Profil berhasil diperbarui.",
    };
  } catch (error) {
    console.error("updateMemberProfileAction gagal:", error);
    return { success: false, error: "Profil gagal diperbarui. Silakan coba lagi." };
  }
}
