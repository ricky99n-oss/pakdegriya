import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSupabase } from "@/lib/supabase";

export async function validateRequest() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("supabase_access_token")?.value;
    if (!accessToken) return { user: null };

    const { data, error } = await getSupabase().auth.getUser(accessToken);
    if (error || !data?.user) return { user: null };

    const email = String(data.user.email || "").trim().toLowerCase();
    if (email) {
      const records = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          phone: users.phone,
          role: users.role,
        })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (records.length) return { user: records[0] };
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
    console.error("validateRequest gagal:", error);
    return { user: null };
  }
}
