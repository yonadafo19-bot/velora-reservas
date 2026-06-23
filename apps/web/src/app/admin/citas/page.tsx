import { AdminPage } from "@/components/admin/admin-page";
import { getAdminCalendar } from "@/lib/admin-calendar-api";
import { getAdminVertical } from "@/lib/admin-page";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ negocio?: string }> }) {
  const vertical = await getAdminVertical(searchParams);
  const calendar = await getAdminCalendar(vertical);

  return <AdminPage view="citas" vertical={vertical} path="/admin/citas" calendar={calendar}/>;
}
