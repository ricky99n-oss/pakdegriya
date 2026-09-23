import { createClient } from '@supabase/supabase-js';

// Mengambil URL dan Key dari .env yang sudah Anda isi sebelumnya
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);