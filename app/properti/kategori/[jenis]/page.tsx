import { notFound } from "next/navigation";
import PropertyCatalog from "@/components/PropertyCatalog";
import { catalogMetadata, parseCatalogPage } from "@/lib/catalog";
import { isPropertyCategory } from "@/lib/seo";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ jenis: string }>; searchParams: Promise<{ page?: string | string[] }> };
async function options({ params, searchParams }: Props) {
  const { jenis } = await params;
  if (!isPropertyCategory(jenis)) notFound();
  return { category: jenis, page: parseCatalogPage((await searchParams).page) };
}
export async function generateMetadata(props: Props) { const { category, page } = await options(props); return catalogMetadata(category, page); }
export default async function CategoryPage(props: Props) { return <PropertyCatalog {...await options(props)} />; }
