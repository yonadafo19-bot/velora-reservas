import type {
  AdminAppointmentAvailability,
  AdminAppointmentAvailabilityLoadState,
  AdminAppointmentCustomersLoadState,
  AdminAppointmentCustomerOption,
  AdminAppointmentFormLoadState,
  AdminAppointmentLocationOption,
  AdminAppointmentProfessionalOption,
  AdminAppointmentServiceOption,
  AdminAppointmentFormLoadBlock,
  AdminCreateAppointmentInput,
  AdminCreateAppointmentResult,
} from "@/types/admin-appointment-form";
import { getAuthenticatedAdminApiConfig } from "@/lib/admin-api";

const DEFAULT_TIME_ZONE = "America/Santiago";
const PAST_DATE_MESSAGE = "No puedes crear una cita en una fecha pasada.";
const FORM_LOAD_ERROR_MESSAGE = "No pudimos cargar los datos para crear una cita. Intenta nuevamente.";
const FORM_AUTH_ERROR_MESSAGE = "No pudimos cargar los datos para crear una cita. Revisa la sesión de administrador.";
interface ProfessionalAvailabilityResponse {
  locations: AdminAppointmentLocationOption[];
  businessHours: AdminAppointmentAvailability["businessHours"];
  weeklyRules: AdminAppointmentAvailability["weeklyRules"];
  timeOff: AdminAppointmentAvailability["timeOff"];
}

interface AppointmentCalendarResponse {
  appointments?: Array<{
    status?: string;
    startAt?: string;
    endAt?: string;
  }>;
}

interface ApiErrorResponse {
  code?: string;
  message?: string;
}

class AdminFormLoadError extends Error {
  constructor(
    readonly block: AdminAppointmentFormLoadBlock,
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "AdminFormLoadError";
  }
}

export async function getAdminAppointmentFormData(
  businessSlug: string,
): Promise<AdminAppointmentFormLoadState> {
  const config = await getAuthenticatedAdminApiConfig(businessSlug);

  try {
    const [servicesPayload, customersPayload, professionalsPayload] = await Promise.all([
      getAdminApi<unknown>(config, `/businesses/${businessSlug}/services`, "services"),
      getAdminApi<unknown>(config, `/businesses/${businessSlug}/customers`, "customers"),
      getAdminApi<unknown>(config, `/businesses/${businessSlug}/professionals`, "professionals"),
    ]);
    const services = requireArray<AdminAppointmentServiceOption>(
      servicesPayload,
      "services",
      "services",
    );
    const customers = requireArray<AdminAppointmentCustomerOption>(
      customersPayload,
      "customers",
      "customers",
    );
    const professionals = requireArray<AdminAppointmentProfessionalOption>(
      professionalsPayload,
      "professionals",
      "professionals",
    );
    const activeServices = services.filter((service) => service.isActive);
    const activeProfessionals = professionals
      .filter((professional) => professional.isActive)
      .map((professional) => ({
        ...professional,
        locations: (professional.locations ?? []).filter((location) => location.status === "ACTIVE"),
      }));
    const locations = [...new Map(
      activeProfessionals
        .flatMap((professional) => professional.locations)
        .map((location) => [location.id, location]),
    ).values()];
    return {
      status: "ready",
      data: {
        businessSlug,
        vertical: config.vertical,
        services: activeServices,
        customers,
        professionals: activeProfessionals,
        locations,
        locationsByProfessionalId: Object.fromEntries(
          activeProfessionals.map((professional) => [
            professional.id,
            professional.locations.map((location) => location.id),
          ]),
        ),
        availabilityByProfessionalId: {},
      },
    };
  } catch (error) {
    const block = error instanceof AdminFormLoadError ? error.block : undefined;
    logAdminFormLoadError(block ?? "availability", error);

    return {
      status: "error",
      message: isUnauthorizedFormLoadError(error) ? FORM_AUTH_ERROR_MESSAGE : FORM_LOAD_ERROR_MESSAGE,
      debugBlock: block,
    };
  }
}

export async function getAdminAppointmentProfessionalAvailability(
  input: {
    businessSlug: string;
    professionalId: string;
    locationId: string;
    date: string;
    includeBookedIntervals?: boolean;
  },
): Promise<AdminAppointmentAvailabilityLoadState> {
  if (!isNonEmptyString(input.professionalId)
    || !isNonEmptyString(input.locationId)
    || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    return { status: "error", message: "Completa profesional, ubicación y fecha para revisar horarios." };
  }

  const config = await getAuthenticatedAdminApiConfig(input.businessSlug);

  try {
    const calendarUrl = new URL(
      `${config.apiUrl}/businesses/${config.businessSlug}/dashboard/calendar`,
    );
    calendarUrl.searchParams.set("from", toSantiagoUtcIso(input.date, "00:00"));
    calendarUrl.searchParams.set("to", toSantiagoUtcIso(addCalendarDays(input.date, 1), "00:00"));
    calendarUrl.searchParams.set("professionalId", input.professionalId);
    calendarUrl.searchParams.set("locationId", input.locationId);
    const [availabilityPayload, calendarPayload] = await Promise.all([
      getAdminApi<unknown>(
        config,
        `/businesses/${config.businessSlug}/professionals/${encodeURIComponent(input.professionalId)}/availability`,
        "availability",
      ),
      input.includeBookedIntervals === false
        ? Promise.resolve({ appointments: [] } satisfies AppointmentCalendarResponse)
        : getAdminApi<AppointmentCalendarResponse>(
            config,
            calendarUrl.toString().slice(config.apiUrl.length),
            "availability",
          ),
    ]);
    const normalized = normalizeProfessionalAvailability(availabilityPayload);
    const locations = normalized.locations.filter((location) => location.status === "ACTIVE");

    return {
      status: "ready",
      data: {
        professionalId: input.professionalId,
        locations,
        availability: {
          businessHours: normalized.businessHours.filter((rule) => rule.status === "ACTIVE"),
          weeklyRules: normalized.weeklyRules.filter((rule) => rule.status === "ACTIVE"),
          timeOff: normalized.timeOff.filter((entry) => entry.status === "ACTIVE"),
          bookedIntervals: normalizeBookedIntervals(calendarPayload),
        },
      },
    };
  } catch (error) {
    logAdminFormLoadError("availability", error);
    return {
      status: "error",
      message: "No pudimos cargar la disponibilidad. Intenta nuevamente.",
    };
  }
}

export async function createAdminAppointment(
  input: AdminCreateAppointmentInput,
): Promise<AdminCreateAppointmentResult> {
  const config = await getAuthenticatedAdminApiConfig(input.businessSlug);

  const validation = validateCreateAppointmentInput(input);
  if (!validation.ok) {
    return validation;
  }

  try {
    const response = await fetch(
      `${config.apiUrl}/businesses/${input.businessSlug}/appointments`,
      {
        method: "POST",
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${config.token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locationId: input.locationId,
          customerId: input.customerId,
          startAt: toSantiagoUtcIso(input.date, input.time),
          serviceIds: input.serviceIds,
          professionalId: input.professionalId,
          source: "ADMIN",
        }),
      },
    );
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const code = typeof (payload as ApiErrorResponse).code === "string"
        ? (payload as ApiErrorResponse).code!
        : "ADMIN_APPOINTMENT_CREATE_FAILED";

      return {
        ok: false,
        code,
        message: mapCreateAppointmentError(code),
      };
    }

    return {
      ok: true,
      appointmentId: typeof (payload as { id?: unknown }).id === "string"
        ? (payload as { id: string }).id
        : "",
    };
  } catch {
    return {
      ok: false,
      code: "ADMIN_APPOINTMENT_CREATE_FAILED",
      message: "No pudimos crear la cita. Intenta nuevamente.",
    };
  }
}

export function toSantiagoUtcIso(date: string, time: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    throw new RangeError("Fecha u hora invalida.");
  }

  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);

  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) {
    throw new RangeError("Fecha u hora invalida.");
  }

  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));
  const firstOffset = getTimezoneOffsetMilliseconds(utcGuess);
  const firstCandidate = new Date(utcGuess.getTime() - firstOffset);
  const secondOffset = getTimezoneOffsetMilliseconds(firstCandidate);
  const finalCandidate = new Date(utcGuess.getTime() - secondOffset);

  if (formatSantiagoWallTime(finalCandidate) !== `${date}T${time}:00`) {
    throw new RangeError("Fecha u hora invalida.");
  }

  return finalCandidate.toISOString();
}

function validateCreateAppointmentInput(
  input: AdminCreateAppointmentInput,
): AdminCreateAppointmentResult | { ok: true } {
  if (!isNonEmptyString(input.businessSlug)
    || !isNonEmptyString(input.customerId)
    || !Array.isArray(input.serviceIds)
    || input.serviceIds.length === 0
    || input.serviceIds.some((serviceId) => !isNonEmptyString(serviceId))
    || new Set(input.serviceIds).size !== input.serviceIds.length
    || !isNonEmptyString(input.professionalId)
    || !isNonEmptyString(input.locationId)
    || !isNonEmptyString(input.date)
    || !isNonEmptyString(input.time)) {
    return {
      ok: false,
      code: "ADMIN_APPOINTMENT_INVALID_INPUT",
      message: "Completa todos los campos antes de crear la cita.",
    };
  }

  try {
    toSantiagoUtcIso(input.date, input.time);
  } catch {
    return {
      ok: false,
      code: "ADMIN_APPOINTMENT_INVALID_INPUT",
      message: "Revisa la fecha y hora de la cita.",
    };
  }

  if (input.date < getSantiagoTodayDate()) {
    return {
      ok: false,
      code: "ADMIN_APPOINTMENT_PAST_DATE",
      message: PAST_DATE_MESSAGE,
    };
  }

  return { ok: true };
}

async function getAdminApi<T>(
  config: { apiUrl: string; token: string },
  path: string,
  block: AdminAppointmentFormLoadBlock,
): Promise<T> {
  const response = await fetch(`${config.apiUrl}${path}`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new AdminFormLoadError(block, `Admin API request failed with status ${response.status}.`, response.status);
  }

  try {
    return await response.json() as T;
  } catch {
    throw new AdminFormLoadError(block, "Admin API returned invalid JSON.");
  }
}

function normalizeProfessionalAvailability(payload: unknown): ProfessionalAvailabilityResponse {
  if (!payload || typeof payload !== "object") {
    throw new AdminFormLoadError("availability", "Availability payload is not an object.");
  }

  const value = payload as Partial<ProfessionalAvailabilityResponse>;

  return {
    locations: requireArray<AdminAppointmentLocationOption>(
      value.locations,
      "availability",
      "locations",
    ),
    businessHours: requireArray<AdminAppointmentAvailability["businessHours"][number]>(
      value.businessHours,
      "availability",
      "businessHours",
    ),
    weeklyRules: requireArray<AdminAppointmentAvailability["weeklyRules"][number]>(
      value.weeklyRules,
      "availability",
      "weeklyRules",
    ),
    timeOff: requireArray<AdminAppointmentAvailability["timeOff"][number]>(
      value.timeOff,
      "availability",
      "timeOff",
    ),
  };
}

export async function getAdminAppointmentCustomers(
  businessSlug: string,
): Promise<AdminAppointmentCustomersLoadState> {
  const config = await getAuthenticatedAdminApiConfig(businessSlug);
  try {
    const payload = await getAdminApi<unknown>(
      config,
      `/businesses/${config.businessSlug}/customers`,
      "customers",
    );
    return {
      status: "ready",
      customers: requireArray<AdminAppointmentCustomerOption>(payload, "customers", "customers"),
    };
  } catch (error) {
    logAdminFormLoadError("customers", error);
    return {
      status: "error",
      message: "No pudimos cargar los clientes. Intenta nuevamente.",
    };
  }
}

function normalizeBookedIntervals(payload: AppointmentCalendarResponse) {
  if (!Array.isArray(payload.appointments)) {
    throw new AdminFormLoadError("availability", "Calendar appointments payload is not an array.");
  }

  return payload.appointments.flatMap((appointment) => {
    if (appointment.status !== "CONFIRMED"
      || !isNonEmptyString(appointment.startAt)
      || !isNonEmptyString(appointment.endAt)) {
      return [];
    }

    return [{
      startsAt: appointment.startAt,
      endsAt: appointment.endAt,
    }];
  });
}

function addCalendarDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0));

  return [
    value.getUTCFullYear(),
    String(value.getUTCMonth() + 1).padStart(2, "0"),
    String(value.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function requireArray<T>(
  value: unknown,
  block: AdminAppointmentFormLoadBlock,
  field: string,
): T[] {
  if (!Array.isArray(value)) {
    throw new AdminFormLoadError(block, `Expected ${field} to be an array.`);
  }

  return value as T[];
}

function logAdminFormLoadError(block: AdminAppointmentFormLoadBlock, error: unknown) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const message = error instanceof Error ? error.message : "Error desconocido.";
  const status = error instanceof AdminFormLoadError && error.status
    ? ` status=${error.status}`
    : "";

  console.warn(`[admin/citas] Fallo controlado en ${block}:${status} ${message}`);
}

function isUnauthorizedFormLoadError(error: unknown) {
  return error instanceof AdminFormLoadError && error.status === 401;
}

function getTimezoneOffsetMilliseconds(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: DEFAULT_TIME_ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const valueByType = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  const utcTime = Date.UTC(
    Number(valueByType.year),
    Number(valueByType.month) - 1,
    Number(valueByType.day),
    Number(valueByType.hour),
    Number(valueByType.minute),
    Number(valueByType.second),
  );

  return utcTime - date.getTime();
}

function formatSantiagoWallTime(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: DEFAULT_TIME_ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const valueByType = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${valueByType.year}-${valueByType.month}-${valueByType.day}T${valueByType.hour}:${valueByType.minute}:${valueByType.second}`;
}

function getSantiagoTodayDate(): string {
  return formatSantiagoWallTime(new Date()).slice(0, 10);
}

function mapCreateAppointmentError(code: string): string {
  const messages: Record<string, string> = {
    APPOINTMENT_CREATE_INVALID_INPUT: "Revisa los datos de la cita.",
    APPOINTMENT_INVALID_SERVICE_SELECTION: "Revisa los servicios seleccionados.",
    APPOINTMENT_SLOT_IN_PAST: "El horario seleccionado ya pasó.",
    APPOINTMENT_OUTSIDE_BUSINESS_HOURS: "El horario esta fuera del horario del negocio.",
    APPOINTMENT_OUTSIDE_PROFESSIONAL_AVAILABILITY: "El profesional no esta disponible en ese horario.",
    APPOINTMENT_SLOT_BLOCKED: "Ese horario esta bloqueado. Elige otro.",
    APPOINTMENT_SLOT_ALREADY_TAKEN: "Ese horario acaba de ser reservado. Elige otra hora disponible.",
    APPOINTMENT_CUSTOMER_OVERLAP: "El cliente ya tiene una cita en ese horario. Elige otro horario o revisa su agenda.",
    LOCATION_NOT_FOUND: "La ubicación seleccionada no está disponible.",
    CUSTOMER_NOT_FOUND: "El cliente seleccionado no existe.",
    SERVICE_NOT_FOUND: "El servicio seleccionado no existe.",
    PROFESSIONAL_NOT_FOUND: "El profesional seleccionado no existe.",
    PROFESSIONAL_SERVICE_NOT_AVAILABLE: "El profesional no realiza el servicio seleccionado.",
    PROFESSIONAL_SERVICE_NOT_ALLOWED: "El profesional no realiza el servicio seleccionado.",
  };

  return messages[code] ?? "No pudimos crear la cita. Intenta nuevamente.";
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
