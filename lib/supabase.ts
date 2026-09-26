import { createClient } from "@supabase/supabase-js";
import { getRequestContext } from "@cloudflare/next-on-pages";

function runtimeEnv() {
  try {
    return getRequestContext().env as Record<string, any>;
  } catch {
    return {} as Record<string, any>;
  }
}

function resolveSupabaseUrl() {
  const env = runtimeEnv();
  return env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
}

function resolveAnonKey() {
  const env = runtimeEnv();
  return env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
}

function resolveServiceRoleKey() {
  const env = runtimeEnv();
  return env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

function baseAuthOptions() {
  return {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  };
}

export const getSupabase = () => {
  const supabaseUrl = resolveSupabaseUrl() || "https://dummy.supabase.co";
  const supabaseKey = resolveAnonKey() || "dummy-key";

  return createClient(supabaseUrl, supabaseKey, {
    auth: baseAuthOptions(),
  });
};

/** Client anon yang menjalankan request sebagai user dengan access token tertentu. */
export const getSupabaseForAccessToken = (accessToken: string) => {
  const supabaseUrl = resolveSupabaseUrl();
  const anonKey = resolveAnonKey();
  if (!supabaseUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL belum dikonfigurasi.");
  if (!anonKey) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY belum dikonfigurasi.");

  return createClient(supabaseUrl, anonKey, {
    auth: baseAuthOptions(),
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
};

/**
 * Server-only Supabase client untuk operasi database yang harus melewati RLS.
 * Menggunakan REST/HTTPS sehingga aman di Next Edge Runtime dan tidak memakai
 * Node.js net/tls seperti driver PostgreSQL TCP.
 *
 * SUPABASE_SERVICE_ROLE_KEY wajib disimpan sebagai Secret di Cloudflare,
 * jangan pernah memakai prefix NEXT_PUBLIC_.
 */
export const getSupabaseAdmin = () => {
  const supabaseUrl = resolveSupabaseUrl();
  const serviceRoleKey = resolveServiceRoleKey();

  if (!supabaseUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL belum dikonfigurasi.");
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi.");

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: baseAuthOptions(),
  });
};

// Kompatibilitas untuk file lama yang masih menggunakan import { supabase }.
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get: (_, prop) => {
    const instance = getSupabase();
    return (instance as any)[prop];
  },
});
