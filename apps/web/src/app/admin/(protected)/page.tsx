import { AdminPage } from "@/components/admin/admin-page";

import { getAdminPageContext } from "@/lib/admin-page";
import { getAdminOverview } from "@/lib/admin-overview-api";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ negocio?: string }> }) {
  const context = await getAdminPageContext(searchParams, "/admin");
  const overview = await getAdminOverview({
    businessSlug: context.business.businessSlug,
    businessName: context.business.businessName,
  });
  return <AdminPage view="resumen" vertical={context.business.vertical} path="/admin" navigation={context.navigation} overview={overview}/>;
}
