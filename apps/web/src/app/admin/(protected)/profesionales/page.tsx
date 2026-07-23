import { AdminProfessionalsPanel } from "@/components/admin/admin-professionals-panel";
import { operationalBusinessName } from "@/components/admin/admin-session-nav";
import { getAdminPageContext } from "@/lib/admin-page";
import { getAdminProfessionalsData } from "@/lib/admin-professionals-api";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ negocio?: string }> }) {
  const context = await getAdminPageContext(searchParams, "/admin/profesionales");
  const { business } = context;
  const professionalsState = await getAdminProfessionalsData(business.businessSlug);

  return <div className="admin-content">
        <div className="admin-heading">
          <div>
            <span className="eyebrow">{operationalBusinessName(business.businessName).toUpperCase()}</span>
            <h1>Equipo</h1>
            <p>Gestiona el equipo y sus servicios disponibles para la agenda.</p>
          </div>
        </div>
        <AdminProfessionalsPanel state={professionalsState}/>
  </div>;
}
