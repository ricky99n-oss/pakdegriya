"use client";
import { useEffect, useRef, useState } from "react";
import { Download, Pencil, Search, Users, X } from "lucide-react";
import { loadAllMembers, loadMemberPage } from "@/lib/member-client";
import type { Member, MemberPage } from "@/lib/members";
import { useAutoDismiss } from "@/lib/use-auto-dismiss";

const fieldClass = "w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-[#281C15]";
export default function MemberManager() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState({ q: "", role: "", page: 1 });
  const [data, setData] = useState<MemberPage | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const editTrigger = useRef<HTMLButtonElement | null>(null);
  const closeEditor = () => { setEditing(null); editTrigger.current?.focus(); };
  const [editing, setEditing] = useState<Member | null>(null);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [notice, setNotice] = useState<{ success: boolean; text: string } | null>(null);
  useAutoDismiss(notice, setNotice);
  useEffect(() => {
    const controller = new AbortController();
    loadMemberPage(filter.q, filter.role, filter.page, 50, controller.signal).then((result) => {
      if (!controller.signal.aborted) { setData(result); setLoadError(""); }
    }).catch((error: unknown) => { if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : "Data gagal dimuat."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [filter, version]);
  const reload = () => { setLoading(true); setVersion((value) => value + 1); };
  const changeFilter = (next: typeof filter) => { setLoading(true); setFilter(next); };
  const exportFile = async (format: "xlsx" | "pdf") => {
    if (exporting) return;
    setExporting(true);
    try {
      const rows = await loadAllMembers(filter.q, filter.role);
      if (!rows.length) throw new Error("Tidak ada member untuk diekspor.");
      const { createMemberExcel, createMemberPdf, downloadMemberFile } = await import("@/lib/member-export");
      const bytes = format === "xlsx" ? await createMemberExcel(rows) : await createMemberPdf(rows);
      downloadMemberFile(bytes, format === "xlsx" ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "application/pdf", format);
      setNotice({ success: true, text: `${rows.length} akun berhasil diekspor.` });
    } catch (error) { setNotice({ success: false, text: error instanceof Error ? error.message : "Ekspor gagal." }); }
    finally { setExporting(false); }
  };
  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing || saving) return;
    const values = new FormData(event.currentTarget);
    setSaving(true);
    try {
      const response = await fetch("/api/admin/members", { method: "PATCH", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editing.id, name: values.get("name"), phone: values.get("phone") }) });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) throw new Error(result?.error || `Simpan gagal (HTTP ${response.status}).`);
      closeEditor(); setNotice({ success: true, text: result.message }); reload();
    } catch (error) { setNotice({ success: false, text: error instanceof Error ? error.message : "Simpan gagal. Muat ulang sebelum mencoba lagi." }); }
    finally { setSaving(false); }
  };
  const totalPages = Math.max(1, Math.ceil((data?.total || 0) / 50));
  return <div className="space-y-4 text-[#281C15]">
    {notice && <div role={notice.success ? "status" : "alert"} className={`fixed top-5 inset-x-4 md:left-auto md:right-6 md:max-w-md z-[9999] p-4 rounded-xl shadow-xl border ${notice.success ? "bg-green-50 text-green-800 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>{notice.text}</div>}
    <div className="flex flex-wrap gap-3 justify-between items-center bg-white border border-[#D6A34A]/20 p-5 rounded-2xl">
      <div className="flex gap-3 items-center"><Users className="text-[#D6A34A]" /><div><p className="font-black text-xl">{data?.total ?? "—"} akun</p><p className="text-xs text-gray-500">Sesuai pencarian dan filter</p></div></div>
      <div className="flex gap-2"><button type="button" disabled={exporting || loading || !!loadError} onClick={() => void exportFile("xlsx")} className="flex items-center gap-2 bg-emerald-700 text-white rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-50"><Download size={16} /> Excel</button><button type="button" disabled={exporting || loading || !!loadError} onClick={() => void exportFile("pdf")} className="flex items-center gap-2 bg-[#4A2F1B] text-white rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-50"><Download size={16} /> PDF</button></div>
    </div>
    {exporting && <p role="status" className="text-sm">Menyiapkan ekspor seluruh hasil filter, termasuk halaman lain...</p>}
    <form onSubmit={(event) => { event.preventDefault(); changeFilter({ ...filter, q: search.trim(), page: 1 }); }} className="flex flex-wrap gap-2">
      <input value={search} onChange={(event) => setSearch(event.target.value)} maxLength={120} placeholder="Cari nama, email, atau WhatsApp" aria-label="Cari member" className={`${fieldClass} flex-1 min-w-56`} />
      <select value={filter.role} onChange={(event) => changeFilter({ ...filter, role: event.target.value, page: 1 })} aria-label="Filter peran" className={`${fieldClass} sm:w-44`}><option value="">Semua akun</option><option value="member">Member</option><option value="admin">Admin</option><option value="superadmin">Superadmin</option></select>
      <button type="submit" className="px-4 py-2 rounded-xl bg-[#D6A34A] font-bold flex gap-2 items-center"><Search size={16} /> Cari</button>
    </form>
    {loadError ? <div role="alert" className="p-5 bg-red-50 border border-red-200 rounded-xl">{loadError}<button type="button" onClick={reload} className="ml-3 underline font-bold">Coba lagi</button></div> : <div className="bg-white rounded-2xl border border-[#D6A34A]/20 overflow-x-auto" aria-busy={loading}>
      <table className="w-full text-sm text-left"><thead className="bg-[#4A2F1B] text-white"><tr>{["Nama / Username", "Email", "WhatsApp", "Peran", "Tanggal Daftar", "Aksi"].map((title) => <th key={title} className="p-4 whitespace-nowrap">{title}</th>)}</tr></thead><tbody>
        {loading ? <tr><td colSpan={6} className="p-8 text-center">Memuat data...</td></tr> : !data?.members.length ? <tr><td colSpan={6} className="p-8 text-center text-gray-500">Tidak ada akun yang cocok.</td></tr> : data.members.map((member) => <tr key={member.id} className="border-b border-gray-100 last:border-0"><td className="p-4 font-bold">{member.name || "Belum diisi"}</td><td className="p-4 break-all">{member.email}</td><td className="p-4 whitespace-nowrap">{member.phone || "Belum diisi"}</td><td className="p-4 capitalize">{member.role}</td><td className="p-4 whitespace-nowrap">{member.created_at ? new Date(member.created_at).toLocaleDateString("id-ID") : "—"}</td><td className="p-4"><button type="button" onClick={(event) => { editTrigger.current = event.currentTarget; setEditing(member); }} className="flex gap-1 items-center font-bold text-[#8a5a12]" aria-label={`Edit ${member.name || member.email}`}><Pencil size={14} /> Edit</button></td></tr>)}
      </tbody></table>
    </div>}
    <div className="flex justify-between items-center text-sm"><p>Halaman {filter.page} dari {totalPages}</p><div className="flex gap-2"><button disabled={loading || filter.page <= 1} onClick={() => changeFilter({ ...filter, page: filter.page - 1 })} className="border rounded-lg px-3 py-2 disabled:opacity-40">Sebelumnya</button><button disabled={loading || filter.page >= totalPages} onClick={() => changeFilter({ ...filter, page: filter.page + 1 })} className="border rounded-lg px-3 py-2 disabled:opacity-40">Berikutnya</button></div></div>
    <p className="text-xs text-gray-500">Nama / Username mengikuti nama akun saat pendaftaran. Email merupakan identitas login.</p>
    {editing && <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"><section role="dialog" onKeyDown={(event) => {
      if (event.key === "Escape" && !saving) { event.preventDefault(); closeEditor(); }
      if (event.key === "Tab") {
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled)"));
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    }} aria-modal="true" aria-labelledby="edit-member-title" className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl"><div className="flex justify-between mb-4"><h2 id="edit-member-title" className="font-black text-xl">Edit Member</h2><button type="button" disabled={saving} onClick={closeEditor} aria-label="Tutup edit member"><X /></button></div><p className="text-sm text-gray-500 mb-4 break-all">{editing.email}</p><form onSubmit={save} className="space-y-4"><label className="block text-sm font-bold">Nama / Username<input autoFocus name="name" required maxLength={120} defaultValue={editing.name || ""} className={`${fieldClass} mt-1`} /></label><label className="block text-sm font-bold">Nomor WhatsApp<input name="phone" type="tel" required maxLength={22} defaultValue={editing.phone || ""} placeholder="08xxx atau +62xxx" className={`${fieldClass} mt-1`} /></label><div className="flex justify-end gap-2"><button type="button" disabled={saving} onClick={closeEditor} className="px-4 py-2">Batal</button><button type="submit" disabled={saving} className="px-4 py-2 bg-[#4A2F1B] text-white rounded-lg font-bold disabled:opacity-50">{saving ? "Menyimpan..." : "Simpan"}</button></div></form></section></div>}
  </div>;
}
