import { cookies } from "next/headers";
import { getSupabase } from "@/lib/supabase";

export async function validateRequest() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("supabase_access_token")?.value;

    if (!accessToken) return { user: null };

    const supabase = getSupabase();
    // Validasi token asli ke Supabase Auth
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data?.user) return { user: null };

    // Coba ambil profil dari tabel public.users kita
    const { data: userRecords, error: dbError } = await supabase
      .from("users")
      .select("*")
      .eq("email", data.user.email)
      .limit(1);

    if (!dbError && userRecords && userRecords.length > 0) {
      return { user: userRecords[0] };
    }

    // FALLBACK AMAN: Jika tabel terblokir RLS atau proses sinkronisasi terlambat,
    // jangan tendang user. Izinkan masuk menggunakan data profil dasar Google.
    return { 
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.full_name || "Member",
        role: "member"
      } 
    };
  } catch (error) {
    return { user: null };
  }
}