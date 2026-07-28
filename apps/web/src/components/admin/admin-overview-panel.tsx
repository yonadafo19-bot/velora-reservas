import Link from "next/link";

import { Icon } from "@/components/ui/icon";
import { operationalDisplayName } from "@/lib/admin-display";
import { formatClp, formatDuration } from "@/lib/formatting";
import type { AdminOverviewLoadState } from "@/types/admin-overview";

export function AdminOverviewPanel({
  overview,
  businessSlug,
}: {
  overview?: AdminOverviewLoadState;
  businessSlug: string;
}) {
  if (!overview || overview.status === "error") {
    return <section className="admin-panel admin-empty-state">
      <div>
        <Icon name="calendar"/>
        <h2>No pudimos preparar el resumen</h2>
        <p>{overview?.message ?? "Intenta nuevamente en unos minutos."}</p>
      </div>
    </section>;
  }

  const { data } = overview;
  return <>
    <section className="admin-overview-welcome">
      <div>
        <span className="eyebrow">{data.localDateLabel}</span>
        <h2>{data.greeting}, {operationalDisplayName(data.businessName)}</h2>
        <p>Esto es lo que necesita tu atención hoy.</p>
      </div>
      <div className="admin-quick-actions">
        <Link className="button" href={`/admin/citas?negocio=${encodeURIComponent(businessSlug)}&nueva=1`}>Nueva cita</Link>
        <Link className="button button--ghost" href={`/admin/servicios?negocio=${encodeURIComponent(businessSlug)}`}>Crear servicio</Link>
      </div>
    </section>

    <div className="metric-grid admin-overview-metrics">
      {data.metrics.map((metric, index) => <article key={metric.label}>
        <span className="metric-icon"><Icon name={index === 4 ? "chart" : index === 1 ? "clock" : "calendar"}/></span>
        <small>{metric.label}</small>
        <strong>{metric.kind === "currency" ? formatClp(metric.value) : metric.value}</strong>
        <em>{metric.detail}</em>
      </article>)}
    </div>

    <div className="admin-overview-grid">
      <section className="admin-panel">
        <div className="panel-heading">
          <div><h2>Próximas citas</h2><p>Atenciones confirmadas para hoy</p></div>
          <Link href={`/admin/citas?negocio=${encodeURIComponent(businessSlug)}`}>Ver agenda</Link>
        </div>
        {data.appointments.length === 0
          ? <div className="admin-empty-state admin-empty-state--compact">
              <div><Icon name="calendar"/><h3>Aún no hay citas para hoy.</h3><Link className="button button--ghost" href={`/admin/citas?negocio=${encodeURIComponent(businessSlug)}&nueva=1`}>Crear cita</Link></div>
            </div>
          : <div className="admin-overview-appointments">
              {data.appointments.map((appointment) => <Link
                key={appointment.id}
                href={`/admin/citas?negocio=${encodeURIComponent(businessSlug)}&cita=${encodeURIComponent(appointment.id)}`}
              >
                <time>{formatTime(appointment.startAt)}</time>
                <span><strong>{appointment.customer.fullName}</strong><small>{appointment.services.map((service) => service.name).join(" + ")}</small></span>
                <span><strong>{appointment.professionals.map((professional) => professional.displayName).join(", ") || "Sin profesional"}</strong><small>{formatDuration(appointment.totalDurationMinutes)} · {formatClp(appointment.totalPriceClp)}</small></span>
                <i className="status status--confirmed">Confirmada</i>
              </Link>)}
            </div>}
      </section>

      <section className="admin-panel">
        <div className="panel-heading"><div><h2>Atención operativa</h2><p>Configuraciones que pueden bloquear reservas</p></div></div>
        {data.alerts.length === 0
          ? <div className="admin-operational-ok"><Icon name="sparkles"/><span><strong>Todo listo para operar</strong>No detectamos configuraciones pendientes.</span></div>
          : <div className="admin-alert-list">{data.alerts.map((alert) => <Link href={alert.href} key={alert.id}><Icon name="clock"/><span><strong>{alert.title}</strong><small>{alert.detail}</small></span><b aria-hidden="true">→</b></Link>)}</div>}
      </section>
    </div>
  </>;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("es-CL", {
    timeZone: "America/Santiago",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
}
