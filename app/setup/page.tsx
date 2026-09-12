import { db } from "../../db";
import { users } from "../../db/schema";
import { count } from "drizzle-orm";
import { redirect } from "next/navigation";
import { createSuperadmin } from "./actions";

export default async function SetupPage() {
  // PENGUNCI KEAMANAN: Cek apakah sudah ada akun yang terdaftar
  const userCount = await db.select({ value: count() }).from(users);
  if (userCount[0].value > 0) {
    redirect("/"); // Jika sudah ada, lemparkan pengunjung kembali ke beranda
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FFF7E8] p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-[#D6A34A]">
        <h1 className="text-2xl font-bold text-[#4A2F1B] mb-2 text-center">Setup Pakde Griya</h1>
        <p className="text-sm text-[#281C15] mb-6 text-center">Buat akun Superadmin pertama Anda.</p>
        
        <form action={createSuperadmin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#281C15]">Nama Lengkap</label>
            <input type="text" name="name" required className="w-full border border-gray-300 p-2 rounded mt-1 text-[#281C15] focus:outline-none focus:border-[#D6A34A]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#281C15]">Email Akses</label>
            <input type="email" name="email" required className="w-full border border-gray-300 p-2 rounded mt-1 text-[#281C15] focus:outline-none focus:border-[#D6A34A]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#281C15]">Password</label>
            <input type="password" name="password" required minLength={6} className="w-full border border-gray-300 p-2 rounded mt-1 text-[#281C15] focus:outline-none focus:border-[#D6A34A]" />
          </div>
          <button type="submit" className="w-full bg-[#4A2F1B] text-white font-bold py-3 px-4 rounded mt-4 hover:bg-[#281C15] transition">
            Buat Akun & Masuk
          </button>
        </form>
      </div>
    </main>
  );
}