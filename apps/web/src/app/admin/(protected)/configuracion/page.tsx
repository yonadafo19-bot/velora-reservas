import { AdminPage } from "@/components/admin/admin-page";

import { getAdminPageContext } from "@/lib/admin-page";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ negocio?: string }> }) {
  const context = await getAdminPageContext(searchParams, "/admin/configuracion");
  return <AdminPage view="configuracion" vertical={context.business.vertical} path="/admin/configuracion" navigation={context.navigation}/>;
}
