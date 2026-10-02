import type { Metadata } from "next";

export const SITE_URL = "https://pakdegriya.com";
export const SITE_NAME = "Pakde Griya";
export const SITE_DESCRIPTION = "Cari rumah, tanah, ruko, villa, dan apartemen dijual atau disewakan di Batu dan Malang Raya. Lihat harga, foto, dan tur 360° bersama Pakde Griya.";
export const NO_INDEX: Metadata = { robots: { index: false, follow: false } };

export const propertyCategories = {
  rumah: { label: "Rumah", description: "Cari rumah dijual atau disewakan di Batu dan Malang Raya. Bandingkan harga, luas tanah, luas bangunan, serta jumlah kamar sebelum menjadwalkan survei." },
  tanah: { label: "Tanah", description: "Temukan tanah dan kavling di Batu serta Malang Raya. Periksa lokasi, luas, harga penawaran, dan akses menuju lahan bersama tim Pakde Griya." },
  ruko: { label: "Ruko", description: "Cari ruko untuk usaha atau investasi di Batu dan Malang Raya. Bandingkan lokasi, harga, dan luas bangunan sesuai kebutuhan bisnis Anda." },
  villa: { label: "Villa", description: "Jelajahi pilihan villa dijual atau disewakan di Batu dan Malang Raya. Lihat harga, foto, fasilitas yang dicantumkan, dan lokasi sebelum survei langsung." },
  apartemen: { label: "Apartemen", description: "Cari apartemen di Batu dan Malang Raya. Bandingkan harga, lokasi, luas unit, dan informasi properti yang tersedia bersama Pakde Griya." },
} as const;
export type PropertyCategory = keyof typeof propertyCategories;
export function isPropertyCategory(value: string): value is PropertyCategory {
  return Object.prototype.hasOwnProperty.call(propertyCategories, value);
}
export function propertyPath(slug: string) { return `/properti/${encodeURIComponent(slug)}`; }
export function catalogPath(category?: PropertyCategory, page = 1) {
  const path = category ? `/properti/kategori/${category}` : "/properti";
  return page > 1 ? `${path}?page=${page}` : path;
}
export function pageMetadata(title: string, description: string, path: string, image = `${SITE_URL}/images/pakde-1.webp`): Metadata {
  const url = `${SITE_URL}${path}`;
  return {
    title, description, alternates: { canonical: url },
    openGraph: { type: "website", locale: "id_ID", siteName: SITE_NAME, title: `${title} | ${SITE_NAME}`, description, url, images: [{ url: image, alt: title }] },
    twitter: { card: "summary_large_image", title: `${title} | ${SITE_NAME}`, description, images: [image] },
  };
}
export function plainText(value: string) { return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(); }
export function safeJsonLd(value: unknown) { return JSON.stringify(value).replace(/</g, "\\u003c"); }
export function breadcrumbs(items: { name: string; path: string }[]) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: `${SITE_URL}${item.path}` })) };
}
export function siteSchema() {
  return { "@context": "https://schema.org", "@graph": [
    { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: SITE_NAME, alternateName: "PakdeGriya.com", url: SITE_URL, inLanguage: "id-ID", publisher: { "@id": `${SITE_URL}/#organization` } },
    { "@type": "RealEstateAgent", "@id": `${SITE_URL}/#organization`, name: SITE_NAME, url: SITE_URL, description: SITE_DESCRIPTION,
      image: `${SITE_URL}/images/pakde-1.webp`, telephone: "+6285815999953", email: "halobos@pakdegriya.com",
      address: { "@type": "PostalAddress", streetAddress: "Jl Patimura GG VI No 10, Temas", addressLocality: "Batu", addressRegion: "Jawa Timur", postalCode: "65326", addressCountry: "ID" },
      areaServed: ["Kota Batu", "Kota Malang", "Kabupaten Malang"],
      sameAs: ["https://www.instagram.com/pakdegriyacom/", "https://www.facebook.com/pakdegriyacom", "https://www.tiktok.com/@pakdegriyacom", "https://www.threads.com/@pakdegriyacom", "https://www.youtube.com/@pakdegriyacom"],
    },
  ] };
}
export type SeoProperty = {
  id: string; slug: string; title: string; public_summary?: string | null; general_location: string;
  property_type: string; transaction_type: string; price: number | string; updated_at?: string | null;
};
export function propertyDescription(property: SeoProperty) {
  const transaction = property.transaction_type === "jual" ? "dijual" : "disewakan";
  const period = property.transaction_type === "sewa_bulan" ? "/bulan" : property.transaction_type === "sewa_tahun" ? "/tahun" : "";
  const summary = plainText(property.public_summary || "");
  return plainText(`${property.title}. ${property.property_type} ${transaction} di ${property.general_location}, Rp ${Number(property.price).toLocaleString("id-ID")}${period}. ${summary || "Lihat detail dan hubungi Pakde Griya untuk survei."}`).slice(0, 170);
}
export function propertySchema(property: SeoProperty, image?: string) {
  const url = `${SITE_URL}${propertyPath(property.slug)}`;
  return {
    "@context": "https://schema.org", "@type": "RealEstateListing", "@id": `${url}#listing`, url,
    name: property.title, description: plainText(property.public_summary || propertyDescription(property)), inLanguage: "id-ID",
    ...(image ? { image } : {}),
    ...(property.updated_at && Number.isFinite(Date.parse(property.updated_at)) ? { dateModified: new Date(property.updated_at).toISOString() } : {}),
    publisher: { "@id": `${SITE_URL}/#organization` },
    offers: { "@type": "Offer", url, price: Number(property.price), priceCurrency: "IDR",
      businessFunction: property.transaction_type === "jual" ? "http://purl.org/goodrelations/v1#Sell" : "http://purl.org/goodrelations/v1#LeaseOut",
      ...(property.transaction_type !== "jual" ? { priceSpecification: { "@type": "UnitPriceSpecification", price: Number(property.price), priceCurrency: "IDR", unitText: property.transaction_type === "sewa_bulan" ? "bulan" : "tahun" } } : {}),
    },
    contentLocation: { "@type": "Place", name: property.general_location },
  };
}
