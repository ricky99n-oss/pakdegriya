import { createClient } from '@supabase/supabase-js';
import { getRequestContext } from "@cloudflare/next-on-pages";

export const getSupabase = () => {
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
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
    // Diabaikan saat proses kompilasi/build
  }

  // Fallback agar Next.js tidak crash saat static rendering di build-time
  if (!supabaseUrl) supabaseUrl = "https://dummy.supabase.co";
  if (!supabaseKey) supabaseKey = "dummy-key";

  return createClient(supabaseUrl, supabaseKey);
};

// Export 'supabase' menggunakan Proxy agar file-file lama yang masih 
// memanggil `import { supabase } from "@/lib/supabase"` tidak error.
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get: (_, prop) => {
    const instance = getSupabase();
    return (instance as any)[prop];
  },
});