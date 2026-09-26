import { AlertTriangle, BadgeCheck, Mail, MessageCircle, ShieldCheck } from "lucide-react";
import { validateRequest } from "@/lib/auth";
import PublicHeader from "@/components/PublicHeader";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";

const sections = [
  {
    title: "1. Ruang Lingkup Layanan",
    body: [
      "Pakde Griya menyediakan layanan pemasaran, penyajian informasi properti, Virtual Tour 360°, komunikasi calon pembeli/penyewa, serta pendampingan proses transaksi sesuai kesepakatan dengan pemilik atau pihak yang berwenang atas properti.",
      "Informasi pada website disusun berdasarkan data yang diterima dari pemilik, pengembang, pengelola, atau sumber lain yang dianggap relevan. Pengguna tetap dianjurkan melakukan pemeriksaan dokumen, kondisi fisik, legalitas, pajak, perizinan, dan hal lain yang material sebelum membuat keputusan transaksi.",
    ],
  },
  {
    title: "2. Akun Member dan Keamanan",
    body: [
      "Pengguna wajib memberikan data yang benar dan menjaga kerahasiaan akses akun. Akun tidak boleh digunakan untuk aktivitas melanggar hukum, mengambil data secara massal, mengganggu sistem, atau menyalahgunakan materi yang tersedia pada Pakde Griya.",
      "Pakde Griya dapat membatasi akses akun apabila terdapat indikasi penyalahgunaan, risiko keamanan, aktivitas otomatis yang tidak wajar, atau pelanggaran terhadap ketentuan ini.",
    ],
  },
  {
    title: "3. Kanal Transaksi Resmi Pakde Griya",
    body: [
      "Pembelian, penyewaan, pembayaran tanda jadi, negosiasi, atau transaksi lain yang mengatasnamakan Pakde Griya hanya dianggap sebagai transaksi melalui Pakde Griya apabila dilakukan melalui tim dan kontak resmi yang tercantum pada website pakdegriya.com atau dikonfirmasi langsung oleh tim resmi Pakde Griya.",
      "Transaksi, pembayaran, komunikasi, atau janji yang dilakukan melalui nomor, akun media sosial, rekening, pihak perantara, atau kanal lain yang tidak tercantum dan tidak dikonfirmasi melalui kanal resmi berada di luar tanggung jawab Pakde Griya. Pengguna wajib melakukan verifikasi sebelum mengirim uang atau dokumen penting.",
    ],
  },
  {
    title: "4. Harga, Ketersediaan, dan Negosiasi",
    body: [
      "Harga, status tersedia, spesifikasi, dan ketentuan penjualan dapat berubah berdasarkan instruksi pemilik atau perkembangan transaksi. Informasi pada website bukan merupakan perjanjian jual beli yang mengikat sampai terdapat dokumen atau kesepakatan resmi dari para pihak terkait.",
      "Penawaran yang disampaikan pengguna dapat diteruskan kepada pemilik, namun penerimaan atau penolakan penawaran sepenuhnya mengikuti persetujuan pihak yang berwenang atas properti.",
    ],
  },
  {
    title: "5. Virtual Tour, Foto, dan Media",
    body: [
      "Foto, video, Virtual Tour 360°, denah, dan materi visual digunakan untuk membantu pengguna memahami properti. Perbedaan pencahayaan, sudut kamera, perubahan kondisi setelah pengambilan gambar, atau keterbatasan perangkat dapat menyebabkan tampilan tidak sepenuhnya sama dengan kondisi saat survei langsung.",
      "Pengguna disarankan melakukan survei fisik sebelum transaksi final apabila kondisi aktual properti menjadi faktor penting dalam keputusan pembelian atau penyewaan.",
    ],
  },
  {
    title: "6. Komunikasi Promo dan Penawaran",
    body: [
      "Pada saat pendaftaran, pengguna dapat memilih secara sukarela untuk menerima rekomendasi properti, promo, informasi layanan, dan penawaran menarik melalui email dan/atau WhatsApp. Persetujuan pemasaran bukan syarat untuk menggunakan akun Pakde Griya.",
      "Pengguna dapat meminta penghentian komunikasi promosi dengan menghubungi kanal resmi Pakde Griya. Pesan yang bersifat penting untuk keamanan akun, verifikasi, atau pelaksanaan layanan dapat tetap dikirim selama diperlukan.",
    ],
  },
  {
    title: "7. Data dan Privasi",
    body: [
      "Data akun digunakan untuk autentikasi, komunikasi layanan, keamanan, pencatatan interaksi, dan penyediaan fitur yang diminta pengguna. Pakde Griya berupaya menerapkan pengamanan yang wajar terhadap sistem dan data yang dikelola.",
      "Pengguna bertanggung jawab memastikan perangkat dan akun email/WhatsApp miliknya tetap aman. Jangan membagikan kode verifikasi, password, atau informasi sensitif kepada pihak yang tidak terverifikasi.",
    ],
  },
  {
    title: "8. Batasan Tanggung Jawab",
    body: [
      "Pakde Griya berupaya menyajikan layanan dan informasi secara akurat, namun tidak menjamin bahwa website akan selalu bebas gangguan, kesalahan teknis, atau perubahan data dari pihak ketiga.",
      "Keputusan pembelian, penyewaan, investasi, pembiayaan, dan tindakan hukum tetap merupakan keputusan pengguna dan para pihak terkait. Pengguna dianjurkan memperoleh pemeriksaan profesional apabila diperlukan, termasuk pemeriksaan dokumen, notaris/PPAT, pajak, pembiayaan, dan aspek teknis bangunan.",
    ],
  },
  {
    title: "9. Perubahan Ketentuan",
    body: [
      "Pakde Griya dapat memperbarui Syarat & Ketentuan untuk menyesuaikan layanan, teknologi, keamanan, atau ketentuan yang berlaku. Versi terbaru akan ditampilkan pada halaman ini dan berlaku sejak dipublikasikan, kecuali dinyatakan lain.",
    ],
  },
];

export default async function SyaratKetentuanPage() {
  const { user } = await validateRequest();

  return (
    <div className="min-h-screen bg-[#FFF7E8] text-[#281C15] flex flex-col">
      <PublicHeader user={user} />
      <main className="flex-1 px-5 py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="mb-10">
            <div className="w-14 h-14 rounded-2xl bg-[#4A2F1B] text-[#D6A34A] flex items-center justify-center mb-5"><ShieldCheck size={28} /></div>
            <p className="text-[10px] uppercase tracking-[.22em] font-black text-[#D6A34A]">Ketentuan Penggunaan</p>
            <h1 className="text-4xl md:text-5xl font-black text-[#4A2F1B] mt-2">Syarat & Ketentuan Pakde Griya</h1>
            <p className="mt-4 text-[#281C15]/65 leading-relaxed">Dengan menggunakan website, membuat akun, atau menggunakan layanan Pakde Griya, pengguna dianggap memahami ketentuan berikut. Terakhir diperbarui: 27 September 2026.</p>
          </div>

          <div className="rounded-3xl border-2 border-[#D6A34A]/40 bg-white p-6 md:p-8 mb-7 shadow-sm">
            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0"><AlertTriangle size={24} /></div>
              <div>
                <h2 className="text-xl font-black text-[#4A2F1B]">Penting: Verifikasi Kanal Resmi Sebelum Transaksi</h2>
                <p className="mt-2 text-sm leading-relaxed text-[#281C15]/75">Jangan mengirim pembayaran kepada pihak yang tidak tercantum atau belum dikonfirmasi oleh tim resmi Pakde Griya. Selalu verifikasi melalui WhatsApp resmi <b>085 815 9999 53</b> atau kontak pada pakdegriya.com.</p>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            {sections.map((section) => (
              <section key={section.title} className="rounded-3xl bg-white border border-[#D6A34A]/20 p-6 md:p-8 shadow-sm">
                <h2 className="text-xl md:text-2xl font-black text-[#4A2F1B]">{section.title}</h2>
                <div className="mt-4 space-y-3">
                  {section.body.map((paragraph) => <p key={paragraph} className="text-sm md:text-base leading-relaxed text-[#281C15]/75">{paragraph}</p>)}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-8 rounded-3xl bg-[#4A2F1B] text-white p-6 md:p-8">
            <div className="flex items-center gap-3"><BadgeCheck className="text-[#D6A34A]" /><h2 className="text-xl font-black">Kontak Resmi</h2></div>
            <div className="mt-5 grid sm:grid-cols-2 gap-3 text-sm">
              <a href="https://wa.me/6285815999953" target="_blank" rel="noopener noreferrer" className="rounded-2xl bg-white/10 border border-white/10 p-4 flex items-center gap-3 hover:border-[#D6A34A]/50"><MessageCircle className="text-[#D6A34A]" size={21} /> WhatsApp 085 815 9999 53</a>
              <a href="mailto:halobos@pakdegriya.com" className="rounded-2xl bg-white/10 border border-white/10 p-4 flex items-center gap-3 hover:border-[#D6A34A]/50"><Mail className="text-[#D6A34A]" size={21} /> halobos@pakdegriya.com</a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
