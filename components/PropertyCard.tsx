import Link from "next/link";
import ShareButton from "@/components/ShareButton";
import { HotItemBadge, NegoBadge } from "@/components/PropertyBadges";

export type ListingProperty = {
  id: string;
  title: string;
  slug: string;
  propertyType: string;
  generalLocation: string;
  price: number | string;
  coverId: string | null;
  isHotItem?: boolean;
  isNegotiable?: boolean;
};

export default function PropertyCard({ item }: { item: ListingProperty }) {
  return (
    <article className={`rounded-3xl overflow-hidden hover:shadow-2xl transition-shadow duration-300 flex flex-col group relative ${item.isHotItem ? "bg-[#FFF7E8] border-2 border-[#C57924] shadow-xl shadow-[#C57924]/15 ring-2 ring-[#D6A34A]/15" : "bg-white shadow-md border border-[#D6A34A]/20"}`}>
      <div className="relative aspect-[16/10] bg-gray-200 overflow-hidden block">
        <Link href={`/properti/${item.slug}`} prefetch={false} className="absolute inset-0 z-10" aria-label={`Lihat ${item.title}`} />
        {item.coverId ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/api/media/${item.coverId}`} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
        ) : <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-sm bg-gray-100">Tanpa Cover</div>}
        <div className="absolute top-4 left-4 flex flex-col items-start gap-2 pointer-events-none z-20">
          {item.isHotItem ? <HotItemBadge /> : null}
          <span className="bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black text-[#4A2F1B] shadow-lg uppercase tracking-wider">{item.propertyType}</span>
        </div>
        <div className="absolute top-4 right-4 z-30"><ShareButton title={item.title} slug={item.slug} /></div>
      </div>
      <div className={`p-6 flex-1 flex flex-col justify-between space-y-4 relative z-20 ${item.isHotItem ? "bg-gradient-to-b from-[#FFF7E8] to-white" : "bg-white"}`}>
        <div>
          <p className="text-[10px] text-[#A97020] font-black uppercase tracking-widest">{item.generalLocation}</p>
          <Link href={`/properti/${item.slug}`} prefetch={false} className="block mt-2 hover:text-[#D6A34A] transition-colors"><h3 className="text-xl font-bold text-[#281C15] line-clamp-2 leading-tight">{item.title}</h3></Link>
          <div className="mt-3 flex flex-wrap items-center gap-2"><p className="text-2xl font-black text-[#4A2F1B]">Rp {Number(item.price || 0).toLocaleString("id-ID")}</p>{item.isNegotiable ? <NegoBadge /> : null}</div>
        </div>
        <Link href={`/properti/${item.slug}`} prefetch={false} className={`w-full block text-center border font-bold py-3.5 rounded-xl transition-colors shadow-sm ${item.isHotItem ? "bg-[#4A2F1B] text-[#F2C87F] border-[#4A2F1B] hover:bg-[#281C15]" : "bg-[#FFF7E8] text-[#4A2F1B] border-[#D6A34A]/40 hover:bg-[#4A2F1B] hover:text-[#D6A34A]"}`}>Lihat Detail</Link>
      </div>
    </article>
  );
}
