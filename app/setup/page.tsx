"use client";

import { useState } from "react";
import { createSuperadmin } from "./actions";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Mencegah reload halaman bawaan form
    setIsLoading(true);
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);
    const res = await createSuperadmin(formData);

    // Menangani kembalian dari Server Action
    if (res?.error) {
      setErrorMsg(res.error);
      setIsLoading(false);
    } else {
      // Jika sukses, langsung lempar ke Dashboard Admin
      router.push("/admin/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFF7E8] p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-[#D6A34A]/20">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#D6A34A] mx-auto flex items-center justify-center text-[#4A2F1B] font-bold text-3xl shadow-lg mb-4">
            P
          </div>
          <h1 className="text-2xl font-bold text-[#281C15]">Setup Super Admin</h1>
          <p className="text-sm text-gray-500 mt-2">Buat akun utama sistem Pakde Griya</p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-bold border border-red-200">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-[#4A2F1B] mb-2">Nama Lengkap</label>
            <input type="text" name="name" required className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:border-[#D6A34A] focus:ring-1 focus:ring-[#D6A34A] bg-gray-50 text-[#281C15]" />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#4A2F1B] mb-2">Email</label>
            <input type="email" name="email" required className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:border-[#D6A34A] focus:ring-1 focus:ring-[#D6A34A] bg-gray-50 text-[#281C15]" />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#4A2F1B] mb-2">Password</label>
            <input type="password" name="password" required className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:border-[#D6A34A] focus:ring-1 focus:ring-[#D6A34A] bg-gray-50 text-[#281C15]" />
          </div>
          <button type="submit" disabled={isLoading} className="w-full bg-[#D6A34A] text-[#281C15] font-bold text-lg py-4 rounded-xl hover:bg-[#c2913b] transition-all shadow-lg disabled:opacity-50 mt-4">
            {isLoading ? "Memproses..." : "Buat Akun"}
          </button>
        </form>
      </div>
    </div>
  );
}