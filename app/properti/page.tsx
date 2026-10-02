import PropertyCatalog from "@/components/PropertyCatalog";
import { catalogMetadata, parseCatalogPage } from "@/lib/catalog";
export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ page?: string | string[] }> };
export async function generateMetadata({ searchParams }: Props) { return catalogMetadata(undefined, parseCatalogPage((await searchParams).page)); }
export default async function CatalogPage({ searchParams }: Props) { return <PropertyCatalog page={parseCatalogPage((await searchParams).page)} />; }
