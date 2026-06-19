import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { clients, getAppointments, getBusiness, getClients, getProfessionals, getServices, metrics, professionals, schedules, services } from "@/data/demo";
import { formatClp, formatDemoDate, formatDuration } from "@/lib/formatting";
import type { AppointmentStatus, BusinessVertical, DemoAppointment } from "@/types/demo";

export type AdminView = "resumen" | "citas" | "clientes" | "servicios" | "profesionales" | "horarios" | "configuracion";

const nav: { view: AdminView; href: string; label: string; icon: "chart" | "calendar" | "users" | "sparkles" | "clock" }[] = [
  { view: "resumen", href: "/admin", label: "Resumen", icon: "chart" },
  { view: "citas", href: "/admin/citas", label: "Citas", icon: "calendar" },
  { view: "clientes", href: "/admin/clientes", label: "Clientes", icon: "users" },
  { view: "servicios", href: "/admin/servicios", label: "Servicios", icon: "sparkles" },
  { view: "profesionales", href: "/admin/profesionales", label: "Profesionales", icon: "users" },
  { view: "horarios", href: "/admin/horarios", label: "Horarios", icon: "clock" },
  { view: "configuracion", href: "/admin/configuracion", label: "Configuración", icon: "sparkles" },
];

const statusLabel: Record<AppointmentStatus, string> = { pending: "Pendiente", confirmed: "Confirmada", completed: "Completada", cancelled: "Cancelada", no_show: "No asistió" };
const titles: Record<AdminView, [string, string]> = {
  resumen: ["Buenos días", "Aquí tienes una mirada rápida a tu negocio."],
  citas: ["Citas", "Revisa y organiza la agenda de tu equipo."],
  clientes: ["Clientes", "Conoce a quienes eligen tu negocio."],
  servicios: ["Servicios", "Tu catálogo demo con precios y duración."],
  profesionales: ["Profesionales", "El equipo que da vida a la experiencia."],
  horarios: ["Horarios", "Disponibilidad semanal del equipo."],
  configuracion: ["Configuración", "Vista previa de los datos del negocio."],
};

function AppointmentTable({ rows }: { rows: DemoAppointment[] }) {
  return <div className="admin-table"><div className="table-head"><span>Hora</span><span>Cliente</span><span>Servicio</span><span>Profesional</span><span>Estado</span></div>{rows.map((appointment) => {
    const client = clients.find((item) => item.clientId === appointment.clientId);
    const service = services.find((item) => item.serviceId === appointment.serviceId);
    const professional = professionals.find((item) => item.professionalId === appointment.professionalId);
    return <div className="table-row" key={appointment.appointmentId}><span data-label="Hora"><strong>{appointment.time}</strong><small>{formatDemoDate(appointment.dayOffset)}</small></span><span data-label="Cliente"><strong>{client?.name}</strong><small>{client?.phone}</small></span><span data-label="Servicio">{service?.name}</span><span data-label="Profesional">{professional?.name}</span><span data-label="Estado"><i className={`status status--${appointment.status}`}>{statusLabel[appointment.status]}</i></span></div>;
  })}</div>;
}

export function AdminPage({ view, vertical, path }: { view: AdminView; vertical: BusinessVertical; path: string }) {
  const business = getBusiness(vertical);
  const businessAppointments = getAppointments(vertical);
  const businessClients = getClients(vertical);
  const businessServices = getServices(vertical);
  const businessProfessionals = getProfessionals(vertical);
  const businessMetric = metrics.find((item) => item.vertical === vertical)!;
  const [title, subtitle] = titles[view];
  return <div className="admin-shell">
    <aside className="admin-sidebar"><Link href="/" className="admin-wordmark"><span>Velora</span><small>RESERVAS</small></Link><div className="demo-admin-label">PANEL DEMOSTRATIVO</div><nav>{nav.map((item) => <Link className={view === item.view ? "active" : ""} href={`${item.href}?negocio=${vertical}`} key={item.view}><Icon name={item.icon}/><span>{item.label}</span></Link>)}</nav><div className="sidebar-bottom"><span className="avatar">VD</span><span><strong>Usuario Demo</strong><small>Administrador ficticio</small></span></div></aside>
    <main className="admin-main"><header className="admin-topbar"><details className="mobile-admin-nav"><summary>Menú</summary><nav>{nav.map((item) => <Link href={`${item.href}?negocio=${vertical}`} key={item.view}>{item.label}</Link>)}</nav></details><div className="vertical-switch"><span>Vista:</span><Link className={vertical === "barberia" ? "active" : ""} href={`${path}?negocio=barberia`}>Barbería</Link><Link className={vertical === "belleza" ? "active" : ""} href={`${path}?negocio=belleza`}>Belleza</Link></div><span className="demo-pill">DATOS DEMO</span></header><div className="admin-content"><div className="admin-heading"><div><span className="eyebrow">{business.name.toUpperCase()}</span><h1>{title}{view === "resumen" ? ", Usuario Demo" : ""}</h1><p>{subtitle}</p></div>{view === "citas" && <button className="button" type="button" disabled>Nueva cita</button>}</div>
      {view === "resumen" && <><div className="metric-grid"><article><span className="metric-icon"><Icon name="calendar"/></span><small>Citas de hoy</small><strong>{businessMetric.todayAppointments}</strong><em>2 pendientes</em></article><article><span className="metric-icon"><Icon name="chart"/></span><small>Esta semana</small><strong>{businessMetric.weekAppointments}</strong><em>+12% vs. anterior</em></article><article><span className="metric-icon"><Icon name="sparkles"/></span><small>Ingreso estimado</small><strong>{formatClp(businessMetric.estimatedMonthlyRevenueClp)}</strong><em>Mes en curso</em></article><article><span className="metric-icon"><Icon name="clock"/></span><small>Ocupación</small><strong>{businessMetric.occupancyPercent}%</strong><em>Agenda disponible</em></article></div><div className="admin-two-col"><section className="admin-panel"><div className="panel-heading"><div><h2>Próximas citas</h2><p>Agenda demo de hoy</p></div><Link href={`/admin/citas?negocio=${vertical}`}>Ver todas</Link></div><AppointmentTable rows={businessAppointments.slice(0, 3)}/></section><section className="admin-panel"><div className="panel-heading"><div><h2>Servicios destacados</h2><p>Más reservados este mes</p></div></div><div className="ranking-list">{businessServices.slice(0, 3).map((service, index) => <div key={service.serviceId}><span>0{index + 1}</span><div><strong>{service.name}</strong><small>{12 - index * 2} reservas demo</small></div><b>{formatClp(service.priceClp)}</b></div>)}</div></section></div><section className="admin-panel recent-clients"><div className="panel-heading"><div><h2>Clientes recientes</h2><p>Actividad ficticia</p></div><Link href={`/admin/clientes?negocio=${vertical}`}>Ver clientes</Link></div><div className="client-strip">{businessClients.map((client) => <div key={client.clientId}><span>{client.name.split(" ").map((part) => part[0]).join("")}</span><div><strong>{client.name}</strong><small>{client.lastVisit}</small></div></div>)}</div></section></>}
      {view === "citas" && <section className="admin-panel"><div className="filter-row"><button className="active">Todas</button><button>Confirmadas</button><button>Pendientes</button><button>Completadas</button></div><AppointmentTable rows={businessAppointments}/></section>}
      {view === "clientes" && <section className="admin-panel"><div className="card-list">{businessClients.map((client) => <article className="entity-card" key={client.clientId}><span className="entity-avatar">{client.name.split(" ").map((part) => part[0]).join("")}</span><div><h3>{client.name}</h3><p>{client.phone}</p></div><div><small>Última visita</small><strong>{client.lastVisit}</strong></div><div><small>Visitas</small><strong>{client.totalVisits}</strong></div></article>)}</div></section>}
      {view === "servicios" && <div className="admin-card-grid">{businessServices.map((service) => <article className="catalog-card" key={service.serviceId}><div><span className="catalog-icon"><Icon name="sparkles"/></span><span className="status status--confirmed">Activo demo</span></div><h3>{service.name}</h3><p>{service.description}</p><footer><span><Icon name="clock" size={16}/>{formatDuration(service.durationMinutes)}</span><strong>{formatClp(service.priceClp)}</strong></footer></article>)}</div>}
      {view === "profesionales" && <div className="admin-card-grid professional-grid">{businessProfessionals.map((person) => <article className="professional-card" key={person.professionalId}><span className="large-avatar">{person.initials}</span><h3>{person.name}</h3><p>{person.role}</p><div><span>{person.serviceIds.length} servicios</span><span className="status status--confirmed">Disponible</span></div></article>)}</div>}
      {view === "horarios" && <section className="admin-panel"><div className="schedule-list">{schedules.filter((item) => item.vertical === vertical).map((schedule) => { const person = professionals.find((item) => item.professionalId === schedule.professionalId)!; return <article key={schedule.professionalId}><div><span className="entity-avatar">{person.initials}</span><span><strong>{person.name}</strong><small>{person.role}</small></span></div><div className="weekday-row">{schedule.weekdays.map((day) => <span key={day}>{day}</span>)}</div><strong>{schedule.startTime} — {schedule.endTime}</strong></article>; })}</div></section>}
      {view === "configuracion" && <section className="admin-panel settings-panel"><div className="demo-notice"><Icon name="sparkles"/><span><strong>Configuración de muestra</strong>Los cambios están deshabilitados y no se guardan.</span></div><div className="form-grid"><label>Nombre del negocio<input value={business.name} readOnly/></label><label>Rubro<input value={vertical === "barberia" ? "Barbería premium" : "Estudio de belleza"} readOnly/></label><label className="full">Dirección<input value={business.address} readOnly/></label><label>Teléfono<input value={business.phone} readOnly/></label><label>Zona horaria<input value="America/Santiago" readOnly/></label></div><button className="button" type="button" disabled>Guardar cambios</button></section>}
    </div></main>
  </div>;
}
