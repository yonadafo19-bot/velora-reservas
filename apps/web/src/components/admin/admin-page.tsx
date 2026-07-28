import { AdminCalendarPanel } from "@/components/admin/admin-calendar-panel";
import { AdminNewAppointmentPanel } from "@/components/admin/admin-new-appointment-panel";
import { AdminOverviewPanel } from "@/components/admin/admin-overview-panel";
import { operationalBusinessName, type AdminNavigation } from "@/components/admin/admin-session-nav";
import { Icon } from "@/components/ui/icon";
import type { AdminAppointmentCustomersLoadState } from "@/types/admin-appointment-form";
import type { AdminCalendarLoadState } from "@/types/admin-calendar";
import type { AdminOverviewLoadState } from "@/types/admin-overview";
import type { BusinessVertical } from "@/types/demo";

export type AdminView = "resumen" | "citas" | "clientes" | "servicios" | "profesionales" | "horarios" | "configuracion";

const titles: Record<AdminView, [string, string]> = {
  resumen: ["Resumen", "Prioridades y actividad real de tu negocio."],
  citas: ["Agenda", "Gestiona las citas y el trabajo diario de tu equipo."],
  clientes: ["Clientes", "Conoce a quienes eligen tu negocio."],
  servicios: ["Servicios", "Gestiona precios, duración y disponibilidad."],
  profesionales: ["Equipo", "Las personas que dan vida a la experiencia."],
  horarios: ["Horarios", "Disponibilidad semanal del equipo."],
  configuracion: ["Configuración", "Datos principales de tu operación."],
};

export function AdminPage({
  view,
  vertical,
  navigation,
  calendar,
  overview,
  initialAppointmentId,
  customers,
}: {
  view: AdminView;
  vertical: BusinessVertical;
  path: string;
  navigation: AdminNavigation;
  calendar?: AdminCalendarLoadState;
  overview?: AdminOverviewLoadState;
  initialAppointmentId?: string;
  customers?: AdminAppointmentCustomersLoadState;
}) {
  const [title, subtitle] = titles[view];
  const currentBusiness = navigation.businesses.find(
    (item) => item.businessSlug === navigation.currentBusinessSlug,
  );
  const businessName = operationalBusinessName(currentBusiness?.businessName ?? "Negocio");

  return <div className="admin-content">
    <div className="admin-heading">
      <div>
        <span className="eyebrow">{businessName.toUpperCase()}</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {view === "citas" && <AdminNewAppointmentPanel businessSlug={navigation.currentBusinessSlug}/>}
    </div>

    {view === "resumen" && <AdminOverviewPanel overview={overview} businessSlug={navigation.currentBusinessSlug}/>}
    {view === "citas" && <AdminCalendarPanel
      calendar={calendar}
      businessSlug={navigation.currentBusinessSlug}
      initialAppointmentId={initialAppointmentId}
    />}
    {view === "clientes" && <section className="admin-panel">
      {!customers || customers.status === "error"
        ? <div className="admin-empty-state"><div><Icon name="calendar"/><h2>No pudimos cargar los clientes</h2><p>{customers?.message ?? "Intenta nuevamente."}</p></div></div>
        : customers.customers.length === 0
          ? <div className="admin-empty-state"><div><Icon name="sparkles"/><h2>Aún no hay clientes</h2><p>Los clientes con citas aparecerán aquí.</p></div></div>
          : <div className="card-list">
              {customers.customers.map((client) => <article className="entity-card" key={client.id}>
                <span className="entity-avatar">{client.fullName.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>
                <div><h3>{client.fullName}</h3><p>{client.phone}</p></div>
                <div><small>Correo</small><strong>{client.email ?? "Sin correo registrado"}</strong></div>
              </article>)}
            </div>}
    </section>}
    {view === "configuracion" && <section className="admin-panel settings-panel">
      <div className="admin-message admin-message--info">
        <Icon name="sparkles"/>
        <span><strong>Información del negocio</strong>Revisa los datos principales de tu operación.</span>
      </div>
      <div className="form-grid">
        <label>Nombre del negocio<input value={businessName} readOnly/></label>
        <label>Rubro<input value={vertical === "barberia" ? "Barbería premium" : "Estudio de belleza"} readOnly/></label>
        <label>Zona horaria<input value="America/Santiago" readOnly/></label>
      </div>
    </section>}
  </div>;
}
