import { AdminServicesPanel } from "@/components/admin/admin-services-panel";
import { getAdminPageContext } from "@/lib/admin-page";
import { getAdminServicesData } from "@/lib/admin-services-api";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ negocio?: string }> }) {
  const context = await getAdminPageContext(searchParams, "/admin/servicios");
  const { business } = context;
  const servicesState = await getAdminServicesData(business.businessSlug);

  return <div className="admin-content">
        <div className="admin-heading">
          <div>
            <span className="eyebrow">{business.businessName.toUpperCase()}</span>
            <h1>Servicios</h1>
            <p>Gestiona el catalogo real que alimenta la agenda administrativa.</p>
          </div>
        </div>
        <AdminServicesPanel state={servicesState}/>
  </div>;
}
