import { AdminProfessionalsPanel } from "@/components/admin/admin-professionals-panel";
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
            <span className="eyebrow">{business.businessName.toUpperCase()}</span>
            <h1>Profesionales</h1>
            <p>Gestiona el equipo real y sus servicios disponibles para agenda.</p>
          </div>
        </div>
        <AdminProfessionalsPanel state={professionalsState}/>
  </div>;
}
