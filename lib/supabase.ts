import { createClient } from '@supabase/supabase-js';
import { getRequestContext } from "@cloudflare/next-on-pages";

export const getSupabase = () => {
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  // Sesuaikan nama variabel dengan yang ada di dashboard Cloudflare Anda
  let supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""; 

  try {
    const env = getRequestContext().env as Record<string, any>;
    if (env?.NEXT_PUBLIC_SUPABASE_URL) {
      supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    }
    if (env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    }
  } catch (error) {
    // Diabaikan saat proses build statis
  }

  return createClient(supabaseUrl, supabaseKey);
};