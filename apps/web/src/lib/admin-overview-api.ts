import { getAdminAppointmentFormData, getAdminAppointmentProfessionalAvailability } from "@/lib/admin-appointments-api";
import { getAdminCalendar } from "@/lib/admin-calendar-api";
import type { AdminAppointmentFormData } from "@/types/admin-appointment-form";
import type { AdminCalendarAppointment } from "@/types/admin-calendar";
import type {
  AdminOverviewAlert,
  AdminOverviewLoadState,
  AdminOverviewMetric,
} from "@/types/admin-overview";

const TIME_ZONE = "America/Santiago";

export async function getAdminOverview(input: {
  businessSlug: string;
  businessName: string;
}): Promise<AdminOverviewLoadState> {
  const today = getSantiagoToday();
  const from = localDateTimeToUtc(today, "00:00");
  const to = localDateTimeToUtc(addCalendarDays(today, 1), "00:00");
  const [calendar, form] = await Promise.all([
    getAdminCalendar(input.businessSlug, { from, to }),
    getAdminAppointmentFormData(input.businessSlug),
  ]);

  if (calendar.status !== "ready") {
    return {
      status: "error",
      message: "No pudimos preparar el resumen. Intenta nuevamente.",
    };
  }

  const appointments = calendar.data.appointments;
  const alerts = form.status === "ready"
    ? await buildOperationalAlerts(input.businessSlug, today, form.data)
    : [];

  return {
    status: "ready",
    data: {
      businessName: input.businessName,
      greeting: getGreeting(),
      localDateLabel: formatLocalDate(),
      metrics: buildMetrics(appointments),
      appointments: appointments
        .filter((appointment) =>
          appointment.status === "CONFIRMED"
          && new Date(appointment.endAt).getTime() >= Date.now(),
        )
        .slice(0, 5),
      alerts,
    },
  };
}

async function buildOperationalAlerts(
  businessSlug: string,
  date: string,
  data: AdminAppointmentFormData,
): Promise<AdminOverviewAlert[]> {
  const alerts: AdminOverviewAlert[] = [];
  const activeProfessionals = data.professionals.filter((professional) => professional.isActive);
  const assignedServiceIds = new Set(
    activeProfessionals.flatMap((professional) => professional.services.map((service) => service.id)),
  );

  for (const professional of activeProfessionals) {
    if (professional.services.length === 0) {
      alerts.push({
        id: `professional-services-${professional.id}`,
        title: `${professional.displayName} no tiene servicios asignados`,
        detail: "Asigna al menos un servicio para que pueda recibir citas.",
        href: `/admin/profesionales?negocio=${encodeURIComponent(businessSlug)}`,
      });
    }
    if (professional.locations.length === 0) {
      alerts.push({
        id: `professional-location-${professional.id}`,
        title: `${professional.displayName} no tiene sucursal`,
        detail: "Asigna una sucursal activa para habilitar su agenda.",
        href: `/admin/profesionales?negocio=${encodeURIComponent(businessSlug)}`,
      });
    }
  }

  for (const service of data.services) {
    if (!assignedServiceIds.has(service.id)) {
      alerts.push({
        id: `service-professional-${service.id}`,
        title: `${service.name} no tiene profesional compatible`,
        detail: "El servicio está activo, pero todavía no puede reservarse.",
        href: `/admin/profesionales?negocio=${encodeURIComponent(businessSlug)}`,
      });
    }
  }

  const availability = await Promise.all(
    activeProfessionals
      .filter((professional) => professional.locations.length > 0)
      .map(async (professional) => ({
        professional,
        state: await getAdminAppointmentProfessionalAvailability({
          businessSlug,
          professionalId: professional.id,
          locationId: professional.locations[0].id,
          date,
          includeBookedIntervals: false,
        }),
      })),
  );

  for (const { professional, state } of availability) {
    if (state.status === "ready" && state.data.availability.weeklyRules.length === 0) {
      alerts.push({
        id: `professional-availability-${professional.id}`,
        title: `${professional.displayName} no tiene disponibilidad`,
        detail: "Configura sus horarios para que aparezcan horas reservables.",
        href: `/admin/horarios?negocio=${encodeURIComponent(businessSlug)}&professionalId=${encodeURIComponent(professional.id)}`,
      });
    }
  }

  if (availability.length > 0
    && availability.every(({ state }) =>
      state.status === "ready" && state.data.availability.businessHours.length === 0,
    )) {
    alerts.push({
      id: "business-hours",
      title: "El negocio no tiene horario activo",
      detail: "Configura el horario de atención antes de recibir nuevas citas.",
      href: `/admin/horarios?negocio=${encodeURIComponent(businessSlug)}`,
    });
  }

  return alerts.slice(0, 6);
}

function buildMetrics(appointments: AdminCalendarAppointment[]): AdminOverviewMetric[] {
  const count = (status: AdminCalendarAppointment["status"]) =>
    appointments.filter((appointment) => appointment.status === status).length;
  const estimatedRevenue = appointments
    .filter((appointment) => appointment.status === "CONFIRMED" || appointment.status === "COMPLETED")
    .reduce((total, appointment) => total + appointment.totalPriceClp, 0);
  const cancelled = count("CANCELLED");
  const noShow = count("NO_SHOW");

  return [
    { label: "Citas de hoy", value: appointments.length, detail: "Agenda completa del día", kind: "count" },
    { label: "Confirmadas", value: count("CONFIRMED"), detail: "Próximas atenciones", kind: "count" },
    { label: "Completadas", value: count("COMPLETED"), detail: "Atenciones finalizadas", kind: "count" },
    { label: "Canceladas / no asistió", value: cancelled + noShow, detail: `${cancelled} canceladas · ${noShow} no asistió`, kind: "count" },
    { label: "Ingreso estimado", value: estimatedRevenue, detail: "Confirmadas y completadas hoy", kind: "currency" },
  ];
}

function getGreeting() {
  const hour = Number(new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    hourCycle: "h23",
  }).format(new Date()));

  return hour < 12 ? "Buenos días" : hour < 20 ? "Buenas tardes" : "Buenas noches";
}

function formatLocalDate() {
  const value = new Intl.DateTimeFormat("es-CL", {
    timeZone: TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getSantiagoToday() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function localDateTimeToUtc(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const first = new Date(utcGuess.getTime() - getOffset(utcGuess));
  return new Date(utcGuess.getTime() - getOffset(first));
}

function addCalendarDays(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day + days, 12));
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}-${String(value.getUTCDate()).padStart(2, "0")}`;
}

function getOffset(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return Date.UTC(
    Number(value.year),
    Number(value.month) - 1,
    Number(value.day),
    Number(value.hour),
    Number(value.minute),
    Number(value.second),
  ) - date.getTime();
}
