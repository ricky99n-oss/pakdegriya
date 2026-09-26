import { cookies } from "next/headers";
import { getSupabase } from "@/lib/supabase";
import { getUserProfileByEmail } from "@/lib/user-profile";

export async function validateRequest() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("supabase_access_token")?.value;
    if (!accessToken) return { user: null };

    const { data, error } = await getSupabase().auth.getUser(accessToken);
    if (error || !data?.user) return { user: null };

    const email = String(data.user.email || "").trim().toLowerCase();
    if (email) {
      const profile = await getUserProfileByEmail(email);
      if (profile) {
        return {
          user: {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            phone: profile.phone,
            role: profile.role,
          },
        };
      }
    }

    // Akun valid dari Supabase tetap boleh masuk sebagai member. Profil lengkap
    // akan dibuat pada proses login server-side dan nomor telepon diminta bila perlu.
    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || "Member",
        phone: null,
        role: "member" as const,
      },
    };
  } catch (error) {
    console.error("validateRequest gagal:", {
      message: error instanceof Error ? error.message : String(error),
    });
    return { user: null };
  }
}
