import { redirect } from "next/navigation";
import { UserCircle2 } from "lucide-react";
import { validateRequest } from "@/lib/auth";
import PublicHeader from "@/components/PublicHeader";
import Footer from "@/components/Footer";
import ProfileForm from "./ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  const { user } = await validateRequest();
  if (!user) redirect("/auth/masuk?next=/profil");

  return (
    <div className="min-h-screen bg-[#FFF7E8] text-[#281C15] flex flex-col">
      <PublicHeader user={user} />
      <main className="flex-1 px-5 py-10 md:py-16">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <div className="w-14 h-14 rounded-2xl bg-[#4A2F1B] text-[#D6A34A] flex items-center justify-center mb-4"><UserCircle2 size={28} /></div>
            <p className="text-[10px] uppercase tracking-[.2em] font-black text-[#D6A34A]">Akun Member</p>
            <h1 className="text-3xl md:text-4xl font-black text-[#4A2F1B] mt-1">Profil Saya</h1>
            <p className="text-[#281C15]/65 mt-2">Perbarui informasi akun yang digunakan untuk komunikasi dan akses layanan Pakde Griya.</p>
          </div>

          <div className="bg-white rounded-3xl border border-[#D6A34A]/20 shadow-sm p-6 md:p-8">
            <div className="mb-6 rounded-2xl bg-[#FFF7E8] border border-[#D6A34A]/20 p-4">
              <p className="text-xs uppercase tracking-wider font-black text-[#D6A34A]">Status akun</p>
              <p className="font-black text-[#4A2F1B] capitalize mt-1">{String(user.role || "member")}</p>
            </div>
            <ProfileForm name={String(user.name || "")} email={String(user.email || "")} phone={String(user.phone || "")} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
