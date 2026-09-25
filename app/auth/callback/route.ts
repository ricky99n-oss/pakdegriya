import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.session && data.user) {
      // 1. Simpan Sesi Supabase ke Cookie Browser
      const cookieStore = await cookies();
      cookieStore.set("supabase_access_token", data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: data.session.expires_in,
      });

      // 2. SINKRONISASI AKUN LAMA ATAU BUAT BARU
      const existingUser = await db.select().from(users).where(eq(users.email, data.user.email!));
      
      if (existingUser.length === 0) {
        // Jika belum pernah daftar sama sekali, buatkan akun member baru
        await db.insert(users).values({
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.full_name || data.user.email!.split("@")[0],
          passwordHash: "google_oauth_managed",
          role: "member" as any,
        });
      } else if (existingUser[0].id !== data.user.id) {
        // Jika ini AKUN LAMA, perbarui ID lamanya dengan ID Supabase yang baru
        // agar seluruh data propertinya tetap utuh dan tersambung!
        await db.update(users).set({ id: data.user.id }).where(eq(users.email, data.user.email!));
      }

      // 3. Arahkan ke Dashboard
      return NextResponse.redirect(`${origin}/admin/dashboard`);
    }
  }

  // Jika batal atau gagal
  return NextResponse.redirect(`${origin}/auth/masuk?error=Gagal_menyambungkan_ke_Google`);
}