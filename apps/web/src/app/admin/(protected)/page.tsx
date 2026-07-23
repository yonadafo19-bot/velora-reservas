import { AdminPage } from "@/components/admin/admin-page";

import { getAdminPageContext } from "@/lib/admin-page";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ negocio?: string }> }) {
  const context = await getAdminPageContext(searchParams, "/admin");
  return <AdminPage view="resumen" vertical={context.business.vertical} path="/admin" navigation={context.navigation}/>;
}
