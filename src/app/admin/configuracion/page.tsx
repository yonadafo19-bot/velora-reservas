import { AdminPage } from "@/components/admin/admin-page";
import { getAdminVertical } from "@/lib/admin-page";
export default async function Page({ searchParams }: { searchParams: Promise<{ negocio?: string }> }) { return <AdminPage view="configuracion" vertical={await getAdminVertical(searchParams)} path="/admin/configuracion"/>; }
