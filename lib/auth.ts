import { supabase } from "./supabase";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function validateRequest() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("supabase_access_token")?.value;

  // Jika tidak ada token di cookie, tolak akses
  if (!accessToken) return { user: null };

  // Validasi token langsung ke Supabase Auth
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    return { user: null };
  }

  // Ambil profil lengkap user dari tabel public.users kita 
  const userRecords = await db.select().from(users).where(eq(users.email, data.user.email!));
  
  if (userRecords.length === 0) return { user: null };

  return { user: userRecords[0] };
}