import { AdminPage } from "@/components/admin/admin-page";

import { getAdminPageContext } from "@/lib/admin-page";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ negocio?: string }> }) {
  const context = await getAdminPageContext(searchParams, "/admin/clientes");
  return <AdminPage view="clientes" vertical={context.business.vertical} path="/admin/clientes" navigation={context.navigation}/>;
}
