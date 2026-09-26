import { getSupabaseAdmin } from "@/lib/supabase";

export type AuthUserLike = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, any>;
};

export type UserProfile = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: "member" | "admin" | "superadmin" | string;
  created_at?: string | null;
};

const PROFILE_COLUMNS = "id,email,name,phone,role,created_at";

function normalizeEmail(value: string | null | undefined) {
  return String(value || "").trim().toLowerCase();
}

function googleName(authUser: AuthUserLike) {
  return String(authUser.user_metadata?.full_name || authUser.user_metadata?.name || "").trim();
}

export async function getUserProfileByEmail(emailValue: string) {
  const email = normalizeEmail(emailValue);
  if (!email) return null;

  const { data, error } = await getSupabaseAdmin()
    .from("users")
    .select(PROFILE_COLUMNS)
    .eq("email", email)
    .maybeSingle();

  if (error) throw new Error(`Profile lookup failed: ${error.message}`);
  return (data as UserProfile | null) || null;
}

export async function getUserProfileById(id: string) {
  if (!id) return null;
  const { data, error } = await getSupabaseAdmin()
    .from("users")
    .select(PROFILE_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Profile id lookup failed: ${error.message}`);
  return (data as UserProfile | null) || null;
}

export async function ensureUserProfile(authUser: AuthUserLike) {
  const email = normalizeEmail(authUser.email);
  if (!email) throw new Error("Email akun tidak tersedia.");

  const admin = getSupabaseAdmin();
  let current = await getUserProfileByEmail(email);
  const preferredName = googleName(authUser);

  if (!current) {
    // Jika user mengganti email melalui Supabase Auth, row lama masih memiliki email
    // sebelumnya. Cocokkan lewat auth user id lalu sinkronkan email yang sudah terverifikasi.
    const byId = await getUserProfileById(authUser.id);
    if (byId) {
      const { data, error } = await admin
        .from("users")
        .update({ email, ...(preferredName && !byId.name ? { name: preferredName } : {}) })
        .eq("id", authUser.id)
        .select(PROFILE_COLUMNS)
        .single();
      if (error) throw new Error(`Profile email sync failed: ${error.message}`);
      return data as UserProfile;
    }
  }

  if (current) {
    if (!current.name && preferredName) {
      const { data, error } = await admin
        .from("users")
        .update({ name: preferredName })
        .eq("email", email)
        .select(PROFILE_COLUMNS)
        .single();
      if (error) throw new Error(`Profile name update failed: ${error.message}`);
      current = data as UserProfile;
    }
    return current;
  }

  const name = preferredName || "Member";
  const { error: insertError } = await admin.from("users").insert({
    id: authUser.id,
    email,
    name,
    password_hash: "supabase_managed",
    role: "member",
  });

  if (insertError && insertError.code !== "23505") {
    throw new Error(`Profile insert failed: ${insertError.message}`);
  }

  current = await getUserProfileByEmail(email);
  if (!current) throw new Error("Profil member gagal dibuat.");
  return current;
}

export async function createMemberProfile(input: {
  id: string;
  email: string;
  name: string;
  phone: string;
}) {
  const email = normalizeEmail(input.email);
  if (!email) throw new Error("Email member tidak valid.");

  const admin = getSupabaseAdmin();
  const existing = await getUserProfileByEmail(email);
  if (existing) return existing;

  const byId = await getUserProfileById(input.id);
  if (byId) {
    const { data, error } = await admin
      .from("users")
      .update({ email, name: input.name, phone: input.phone })
      .eq("id", input.id)
      .select(PROFILE_COLUMNS)
      .single();
    if (error) throw new Error(`Member profile update failed: ${error.message}`);
    return data as UserProfile;
  }

  const { error } = await admin.from("users").insert({
    id: input.id,
    email,
    name: input.name,
    phone: input.phone,
    password_hash: "supabase_managed",
    role: "member",
  });

  if (error && error.code !== "23505") {
    throw new Error(`Member profile insert failed: ${error.message}`);
  }

  const created = await getUserProfileByEmail(email);
  if (!created) throw new Error("Profil member gagal dibuat.");
  return created;
}

export async function updateUserPhone(emailValue: string, phone: string) {
  const email = normalizeEmail(emailValue);
  if (!email) throw new Error("Email akun tidak tersedia.");

  const { data, error } = await getSupabaseAdmin()
    .from("users")
    .update({ phone })
    .eq("email", email)
    .select(PROFILE_COLUMNS)
    .single();

  if (error) throw new Error(`Phone update failed: ${error.message}`);
  return data as UserProfile;
}

export async function updateUserProfileById(id: string, input: { name: string; phone: string }) {
  const { data, error } = await getSupabaseAdmin()
    .from("users")
    .update({ name: input.name, phone: input.phone })
    .eq("id", id)
    .select(PROFILE_COLUMNS)
    .single();
  if (error) throw new Error(`Profile update failed: ${error.message}`);
  return data as UserProfile;
}
