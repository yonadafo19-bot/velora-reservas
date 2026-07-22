import { AdminAvailabilityPanel } from "@/components/admin/admin-availability-panel";
import { getAdminAvailabilityData } from "@/lib/admin-availability-api";
import { getAdminPageContext } from "@/lib/admin-page";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ negocio?: string; professionalId?: string }> }) {
  const params = await searchParams;
  const context = await getAdminPageContext(Promise.resolve(params), "/admin/horarios");
  const { business } = context;
  const availabilityState = await getAdminAvailabilityData(business.businessSlug, params.professionalId);

  return <div className="admin-content">
        <div className="admin-heading">
          <div>
            <span className="eyebrow">{business.businessName.toUpperCase()}</span>
            <h1>Horarios</h1>
            <p>Gestiona horarios reales del negocio y disponibilidad semanal del equipo.</p>
          </div>
        </div>
        <AdminAvailabilityPanel state={availabilityState}/>
  </div>;
}
