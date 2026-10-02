export default function PropertyFlagsFields({ isHotItem = false, isNegotiable = false }: { isHotItem?: boolean; isNegotiable?: boolean }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl border border-[#D6A34A]/30 bg-[#FFF7E8] p-4">
      <label className="block text-sm font-bold text-[#4A2F1B]">
        Hot Item
        <select name="isHotItem" defaultValue={String(isHotItem)} className="mt-2 w-full rounded-xl border border-[#D6A34A]/40 bg-white p-3 text-[#281C15]">
          <option value="false">Listing biasa</option>
          <option value="true">Jadikan Hot Item</option>
        </select>
        <span className="mt-2 block text-xs font-normal leading-relaxed">Hot Item tampil paling awal dengan penanda khusus. Jika lebih dari satu, yang terakhir diperbarui tampil lebih dulu.</span>
      </label>
      <label className="block text-sm font-bold text-[#4A2F1B]">
        Negosiasi Harga
        <select name="isNegotiable" defaultValue={String(isNegotiable)} className="mt-2 w-full rounded-xl border border-[#D6A34A]/40 bg-white p-3 text-[#281C15]">
          <option value="false">Harga pas / tidak nego</option>
          <option value="true">Bisa nego</option>
        </select>
        <span className="mt-2 block text-xs font-normal leading-relaxed">Label Nego muncul di listing dan detail properti jika diaktifkan.</span>
      </label>
    </div>
  );
}
