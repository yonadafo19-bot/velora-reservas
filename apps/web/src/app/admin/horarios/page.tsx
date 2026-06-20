import { AdminPage } from "@/components/admin/admin-page";
import { getAdminVertical } from "@/lib/admin-page";
export default async function Page({ searchParams }: { searchParams: Promise<{ negocio?: string }> }) { return <AdminPage view="horarios" vertical={await getAdminVertical(searchParams)} path="/admin/horarios"/>; }
