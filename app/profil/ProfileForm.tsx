"use client";

import { useState } from "react";
import { Loader2, Mail, Phone, Save, UserRound } from "lucide-react";
import { updateMemberProfileAction } from "./actions";

type Props = {
  name: string;
  email: string;
  phone: string;
};

export default function ProfileForm({ name, email, phone }: Props) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const result = await updateMemberProfileAction(new FormData(event.currentTarget));
      if (!result.success) {
        setError(result.error || "Profil gagal diperbarui.");
        return;
      }
      setMessage(result.message || "Profil berhasil diperbarui.");
    } catch (err) {
      console.error(err);
      setError("Koneksi ke server gagal. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      {message && <div className="rounded-2xl border border-green-200 bg-green-50 text-green-800 p-4 text-sm font-bold">{message}</div>}
      {error && <div className="rounded-2xl border border-red-200 bg-red-50 text-red-700 p-4 text-sm font-bold">{error}</div>}

      <Field label="Nama Lengkap" icon={<UserRound size={18} />}>
        <input name="name" defaultValue={name} required maxLength={120} className="w-full h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 focus:outline-none focus:border-[#D6A34A]" />
      </Field>

      <Field label="Nomor Telepon / WhatsApp" icon={<Phone size={18} />}>
        <input name="phone" type="tel" defaultValue={phone} required inputMode="tel" className="w-full h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 focus:outline-none focus:border-[#D6A34A]" placeholder="0812 3456 7890" />
      </Field>

      <Field label="Alamat Email" icon={<Mail size={18} />}>
        <input name="email" type="email" defaultValue={email} required className="w-full h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 focus:outline-none focus:border-[#D6A34A]" />
      </Field>
      <p className="text-xs text-gray-500 -mt-2">Jika email diubah, perubahan baru berlaku setelah tautan verifikasi pada email baru dikonfirmasi.</p>

      <button type="submit" disabled={saving} className="w-full h-12 rounded-xl bg-[#4A2F1B] text-[#D6A34A] font-black flex items-center justify-center gap-2 hover:bg-[#281C15] disabled:opacity-60">
        {saving ? <><Loader2 size={18} className="animate-spin" /> Menyimpan...</> : <><Save size={18} /> Simpan Perubahan</>}
      </button>
    </form>
  );
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-black text-[#4A2F1B] mb-2">{icon}{label}</label>
      {children}
    </div>
  );
}
