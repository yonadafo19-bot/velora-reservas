import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { clients, getAppointments, getBusiness, getClients, getProfessionals, getServices, metrics, professionals, schedules, services } from "@/data/demo";
import { formatClp, formatDemoDate, formatDuration } from "@/lib/formatting";
import type { AdminCalendarAppointment, AdminCalendarLoadState, AdminCalendarStatus } from "@/types/admin-calendar";
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
const calendarStatusLabel: Record<AdminCalendarStatus, string> = {
  CONFIRMED: "Confirmada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_SHOW: "No asistio",
};

const titles: Record<AdminView, [string, string]> = {
  resumen: ["El pulso de tu salón", "Una mirada clara a lo que está pasando hoy."],
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

function MiniTrend({ variant = 1 }: { variant?: number }) {
  const paths = ["M2 27 C14 25 18 15 29 18 S43 8 58 11 S72 3 86 6", "M2 25 C12 13 22 21 31 12 S48 18 58 8 S72 14 86 4", "M2 28 C15 29 18 20 31 21 S44 10 56 14 S72 5 86 8"];
  return <svg className="mini-trend" viewBox="0 0 88 32" role="img" aria-label="Tendencia positiva demostrativa"><path className="mini-trend__area" d={`${paths[(variant - 1) % paths.length]} L86 32 L2 32 Z`}/><path d={paths[(variant - 1) % paths.length]}/><circle cx="86" cy={variant === 2 ? "4" : variant === 3 ? "8" : "6"} r="2.5"/></svg>;
}

function formatCalendarTime(value: string) {
  return new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Santiago",
  }).format(new Date(value));
}

function formatCalendarDate(value: string) {
  return new Intl.DateTimeFormat("es-CL", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "America/Santiago",
  }).format(new Date(`${value}T12:00:00.000Z`));
}

function formatCalendarRange(from: string, to: string) {
  const formatter = new Intl.DateTimeFormat("es-CL", {
    day: "numeric",
    month: "short",
    timeZone: "America/Santiago",
  });

  return `${formatter.format(new Date(from))} al ${formatter.format(new Date(to))}`;
}

function primaryService(appointment: AdminCalendarAppointment) {
  return appointment.services[0]?.name ?? "Servicio sin detalle";
}

function appointmentProfessionals(appointment: AdminCalendarAppointment) {
  return appointment.professionals.length
    ? appointment.professionals.map((professional) => professional.displayName).join(", ")
    : "Sin profesional asignado";
}

function CalendarAppointmentsTable({ appointments }: { appointments: AdminCalendarAppointment[] }) {
  return <div className="admin-table"><div className="table-head"><span>Hora</span><span>Cliente</span><span>Servicio</span><span>Equipo y ubicacion</span><span>Estado</span></div>{appointments.map((appointment) => <div className="table-row" key={appointment.id}><span data-label="Hora"><strong>{formatCalendarTime(appointment.startAt)}</strong><small>{formatCalendarDate(appointment.localDate)}</small></span><span data-label="Cliente"><strong>{appointment.customer.fullName || "Cliente sin nombre"}</strong><small>{appointment.customer.phone}</small></span><span data-label="Servicio"><strong>{primaryService(appointment)}</strong><small>{formatDuration(appointment.totalDurationMinutes)} · {formatClp(appointment.totalPriceClp)}</small></span><span data-label="Equipo y ubicacion"><strong>{appointmentProfessionals(appointment)}</strong><small>{appointment.location.name}</small></span><span data-label="Estado"><i className={`status status--${appointment.status.toLowerCase()}`}>{calendarStatusLabel[appointment.status]}</i></span></div>)}</div>;
}

function CalendarStateNotice({ title, message }: { title: string; message: string }) {
  return <section className="admin-panel"><div className="demo-notice"><Icon name="sparkles"/><span><strong>{title}</strong>{message}</span></div></section>;
}

function AdminCalendarPanel({ calendar }: { calendar?: AdminCalendarLoadState }) {
  if (!calendar) {
    return <CalendarStateNotice title="Agenda real no cargada" message="Falta conectar esta vista con el API de Velora."/>;
  }

  if (calendar.status === "missing-config") {
    return <CalendarStateNotice title="Configuracion o sesion pendiente" message={calendar.message}/>;
  }

  if (calendar.status === "error") {
    return <CalendarStateNotice title="No pudimos cargar la agenda" message={calendar.message}/>;
  }

  const { data } = calendar;

  return <>
    <div className="metric-grid">
      <article><span className="metric-icon"><Icon name="calendar"/></span><small>Total</small><strong>{data.summary.total}</strong><em>Agenda conectada al API de Velora</em></article>
      <article><span className="metric-icon"><Icon name="clock"/></span><small>Confirmadas</small><strong>{data.summary.byStatus.CONFIRMED}</strong><em>Proximos 7 dias</em></article>
      <article><span className="metric-icon"><Icon name="chart"/></span><small>Completadas</small><strong>{data.summary.byStatus.COMPLETED}</strong><em>Rango seleccionado</em></article>
      <article><span className="metric-icon"><Icon name="sparkles"/></span><small>Canceladas / no asistio</small><strong>{data.summary.byStatus.CANCELLED + data.summary.byStatus.NO_SHOW}</strong><em>{data.summary.byStatus.CANCELLED} canceladas · {data.summary.byStatus.NO_SHOW} no asistio</em></article>
    </div>
    <section className="admin-panel">
      <div className="panel-heading"><div><h2>Agenda real</h2><p>{formatCalendarRange(data.range.from, data.range.to)} · {data.range.timezone}</p></div><span className="status status--confirmed">API real</span></div>
      {data.appointments.length === 0
        ? <div className="demo-notice"><Icon name="calendar"/><span><strong>No hay citas para este rango.</strong>Cuando existan reservas reales, apareceran en esta agenda.</span></div>
        : <CalendarAppointmentsTable appointments={data.appointments}/>}
    </section>
  </>;
}

export function AdminPage({ view, vertical, path, calendar }: { view: AdminView; vertical: BusinessVertical; path: string; calendar?: AdminCalendarLoadState }) {
  const business = getBusiness(vertical);
  const businessAppointments = getAppointments(vertical);
  const businessClients = getClients(vertical);
  const businessServices = getServices(vertical);
  const businessProfessionals = getProfessionals(vertical);
  const businessMetric = metrics.find((item) => item.vertical === vertical)!;
  const [title, subtitle] = titles[view];
  return <div className={`admin-shell theme-${vertical}`}>
    <aside className="admin-sidebar"><div className="sidebar-aura"/><Link href="/" className="admin-wordmark"><span>Velora</span><small>RESERVAS</small></Link><div className="demo-admin-label"><i/> CONTROL ROOM · DEMO</div><nav>{nav.map((item) => <Link className={view === item.view ? "active" : ""} href={`${item.href}?negocio=${vertical}`} key={item.view}><Icon name={item.icon}/><span>{item.label}</span></Link>)}</nav><div className="sidebar-insight"><span>HOY</span><strong>{businessMetric.todayAppointments} citas</strong><small>{businessMetric.occupancyPercent}% de ocupación demo</small><i><b style={{ width: `${businessMetric.occupancyPercent}%` }}/></i></div><div className="sidebar-bottom"><span className="avatar">VD</span><span><strong>Usuario Demo</strong><small>Administrador ficticio</small></span></div></aside>
    <main className="admin-main"><header className="admin-topbar"><details className="mobile-admin-nav"><summary>Menú</summary><nav>{nav.map((item) => <Link href={`${item.href}?negocio=${vertical}`} key={item.view}>{item.label}</Link>)}</nav></details><div className="vertical-switch"><span>Vista:</span><Link className={vertical === "barberia" ? "active" : ""} href={`${path}?negocio=barberia`}>Barbería</Link><Link className={vertical === "belleza" ? "active" : ""} href={`${path}?negocio=belleza`}>Belleza</Link></div><span className="demo-pill">DATOS DEMO</span></header><div className="admin-content"><div className="admin-heading"><div><span className="eyebrow">{business.name.toUpperCase()}</span><h1>{title}</h1><p>{subtitle}</p></div>{view === "citas" && <button className="button" type="button" disabled>Nueva cita</button>}</div>
      {view === "resumen" && <><div className="metric-grid"><article><span className="metric-icon"><Icon name="calendar"/></span><small>Citas de hoy</small><strong>{businessMetric.todayAppointments}</strong><em>2 pendientes</em><MiniTrend variant={1}/></article><article><span className="metric-icon"><Icon name="chart"/></span><small>Esta semana</small><strong>{businessMetric.weekAppointments}</strong><em>+12% vs. anterior</em><MiniTrend variant={2}/></article><article><span className="metric-icon"><Icon name="sparkles"/></span><small>Ingreso estimado</small><strong>{formatClp(businessMetric.estimatedMonthlyRevenueClp)}</strong><em>Mes en curso</em><MiniTrend variant={3}/></article><article><span className="metric-icon"><Icon name="clock"/></span><small>Ocupación</small><strong>{businessMetric.occupancyPercent}%</strong><em>Agenda disponible</em><MiniTrend variant={2}/></article></div><div className="admin-two-col"><section className="admin-panel"><div className="panel-heading"><div><h2>Próximas citas</h2><p>Agenda demo de hoy</p></div><Link href={`/admin/citas?negocio=${vertical}`}>Ver todas</Link></div><AppointmentTable rows={businessAppointments.slice(0, 3)}/></section><section className="admin-panel"><div className="panel-heading"><div><h2>Servicios destacados</h2><p>Más reservados este mes</p></div></div><div className="ranking-list">{businessServices.slice(0, 3).map((service, index) => <div key={service.serviceId}><span>0{index + 1}</span><div><strong>{service.name}</strong><small>{12 - index * 2} reservas demo</small></div><b>{formatClp(service.priceClp)}</b></div>)}</div></section></div><section className="admin-panel recent-clients"><div className="panel-heading"><div><h2>Clientes recientes</h2><p>Actividad ficticia</p></div><Link href={`/admin/clientes?negocio=${vertical}`}>Ver clientes</Link></div><div className="client-strip">{businessClients.map((client) => <div key={client.clientId}><span>{client.name.split(" ").map((part) => part[0]).join("")}</span><div><strong>{client.name}</strong><small>{client.lastVisit}</small></div></div>)}</div></section></>}
      {view === "citas" && <AdminCalendarPanel calendar={calendar}/>}
      {view === "clientes" && <section className="admin-panel"><div className="card-list">{businessClients.map((client) => <article className="entity-card" key={client.clientId}><span className="entity-avatar">{client.name.split(" ").map((part) => part[0]).join("")}</span><div><h3>{client.name}</h3><p>{client.phone}</p></div><div><small>Última visita</small><strong>{client.lastVisit}</strong></div><div><small>Visitas</small><strong>{client.totalVisits}</strong></div></article>)}</div></section>}
      {view === "servicios" && <div className="admin-card-grid">{businessServices.map((service) => <article className="catalog-card" key={service.serviceId}><div><span className="catalog-icon"><Icon name="sparkles"/></span><span className="status status--confirmed">Activo demo</span></div><h3>{service.name}</h3><p>{service.description}</p><footer><span><Icon name="clock" size={16}/>{formatDuration(service.durationMinutes)}</span><strong>{formatClp(service.priceClp)}</strong></footer></article>)}</div>}
      {view === "profesionales" && <div className="admin-card-grid professional-grid">{businessProfessionals.map((person) => <article className="professional-card" key={person.professionalId}><span className="large-avatar">{person.initials}</span><h3>{person.name}</h3><p>{person.role}</p><div><span>{person.serviceIds.length} servicios</span><span className="status status--confirmed">Disponible</span></div></article>)}</div>}
      {view === "horarios" && <section className="admin-panel"><div className="schedule-list">{schedules.filter((item) => item.vertical === vertical).map((schedule) => { const person = professionals.find((item) => item.professionalId === schedule.professionalId)!; return <article key={schedule.professionalId}><div><span className="entity-avatar">{person.initials}</span><span><strong>{person.name}</strong><small>{person.role}</small></span></div><div className="weekday-row">{schedule.weekdays.map((day) => <span key={day}>{day}</span>)}</div><strong>{schedule.startTime} — {schedule.endTime}</strong></article>; })}</div></section>}
      {view === "configuracion" && <section className="admin-panel settings-panel"><div className="demo-notice"><Icon name="sparkles"/><span><strong>Configuración de muestra</strong>Los cambios están deshabilitados y no se guardan.</span></div><div className="form-grid"><label>Nombre del negocio<input value={business.name} readOnly/></label><label>Rubro<input value={vertical === "barberia" ? "Barbería premium" : "Estudio de belleza"} readOnly/></label><label className="full">Dirección<input value={business.address} readOnly/></label><label>Teléfono<input value={business.phone} readOnly/></label><label>Zona horaria<input value="America/Santiago" readOnly/></label></div><button className="button" type="button" disabled>Guardar cambios</button></section>}
    </div></main>
  </div>;
}
