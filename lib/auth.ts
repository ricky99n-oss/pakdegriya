import { cookies } from "next/headers";
import { getSupabase } from "@/lib/supabase";

export async function validateRequest() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("supabase_access_token")?.value;

  if (!accessToken) return { user: null };

  const supabase = getSupabase();
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    return { user: null };
  }

  // Gunakan REST API Supabase untuk mengambil data dari public.users (Kebal Edge Error)
  const { data: userRecords, error: dbError } = await supabase
    .from("users")
    .select("*")
    .eq("email", data.user.email)
    .limit(1);
  
  if (dbError || !userRecords || userRecords.length === 0) {
    return { user: null };
  }

  return { user: userRecords[0] };
}