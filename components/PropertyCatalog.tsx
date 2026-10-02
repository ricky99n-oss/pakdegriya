import Link from "next/link";
import { validateRequest } from "@/lib/auth";
import { getCatalog } from "@/lib/catalog";
import { SITE_URL, breadcrumbs, catalogPath, propertyCategories, propertyPath, SITE_DESCRIPTION, type PropertyCategory } from "@/lib/seo";
import PropertyCard from "@/components/PropertyCard";
import PublicHeader from "@/components/PublicHeader";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";

export default async function PropertyCatalog({ category, page }: { category?: PropertyCategory; page: number }) {
  const [{ user }, { properties, total }] = await Promise.all([validateRequest(), getCatalog(category, page)]);
  const title = category ? `${propertyCategories[category].label} di Batu dan Malang Raya` : "Properti di Batu dan Malang Raya";
  const pages = Math.ceil(total / 12);
  return <div className="min-h-screen bg-[#FFF7E8] text-[#281C15]">
    <PublicHeader user={user} />
    <JsonLd data={breadcrumbs([{ name: "Beranda", path: "/" }, { name: "Properti", path: "/properti" }, ...(category ? [{ name: propertyCategories[category].label, path: catalogPath(category) }] : [])])} />
    <JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: title, url: `${SITE_URL}${catalogPath(category, page)}`, mainEntity: { "@type": "ItemList", itemListElement: properties.map((property, index) => ({ "@type": "ListItem", position: (page - 1) * 12 + index + 1, name: property.title, url: `${SITE_URL}${propertyPath(property.slug)}` })) } }} />
    <main className="max-w-7xl mx-auto px-5 py-10 md:py-16">
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap gap-2 text-sm text-[#4A2F1B]"><Link href="/">Beranda</Link><span aria-hidden="true">/</span><Link href="/properti">Properti</Link>{category ? <><span aria-hidden="true">/</span><span aria-current="page">{propertyCategories[category].label}</span></> : null}</nav>
      <h1 className="text-3xl md:text-4xl font-black text-[#4A2F1B]">{title}</h1>
      <p className="mt-4 max-w-3xl leading-relaxed text-[#4A2F1B]/80">{category ? propertyCategories[category].description : SITE_DESCRIPTION}</p>
      <nav aria-label="Kategori properti" className="my-8 flex flex-wrap gap-3">
        <Link href="/properti" aria-current={!category ? "page" : undefined} className="rounded-full border border-[#D6A34A]/40 bg-white px-4 py-2 font-bold">Semua</Link>
        {Object.entries(propertyCategories).map(([key, item]) => <Link key={key} href={`/properti/kategori/${key}`} aria-current={key === category ? "page" : undefined} className={`rounded-full border border-[#D6A34A]/40 px-4 py-2 font-bold ${key === category ? "bg-[#4A2F1B] text-white" : "bg-white"}`}>{item.label}</Link>)}
      </nav>
      <p className="mb-5 text-sm text-[#4A2F1B]/70">{total} properti{pages > 1 ? ` · Halaman ${page} dari ${pages}` : ""}</p>
      {properties.length ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">{properties.map((property) => <PropertyCard key={property.id} item={property} />)}</div> : <div className="rounded-3xl bg-white p-8"><h2 className="text-xl font-bold">Belum ada listing {category ? propertyCategories[category].label.toLowerCase() : "properti"} saat ini</h2><p className="my-3">Jelajahi kategori lain atau hubungi Pakde untuk menyampaikan kebutuhan properti Anda.</p><Link href="/properti" className="font-bold underline">Lihat semua properti</Link></div>}
      <nav aria-label="Halaman katalog" className="mt-10 flex items-center justify-between gap-4">
        {page > 1 ? <Link href={catalogPath(category, page - 1)} rel="prev" className="rounded-xl border bg-white px-5 py-3 font-bold">← Sebelumnya</Link> : <span />}
        {page < pages ? <Link href={catalogPath(category, page + 1)} rel="next" className="rounded-xl bg-[#4A2F1B] px-5 py-3 font-bold text-white">Berikutnya →</Link> : null}
      </nav>
    </main><Footer />
  </div>;
}
