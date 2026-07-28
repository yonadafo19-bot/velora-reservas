import type {
  AdminAppointmentStatusResult,
  AdminAppointmentTargetStatus,
  AdminCalendarAppointment,
  AdminCalendarLoadState,
  AdminCalendarResponse,
  AdminCalendarStatus,
} from "@/types/admin-calendar";
import { getAuthenticatedAdminApiConfig } from "@/lib/admin-api";

const DEFAULT_TIME_ZONE = "America/Santiago";
const DEFAULT_RANGE_DAYS = 7;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const ADMIN_CALENDAR_AUTH_MESSAGE = "No pudimos cargar la agenda. Revisa tu sesión e intenta nuevamente.";

class AdminCalendarLoadError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "AdminCalendarLoadError";
  }
}

export interface AdminCalendarQuery {
  from?: Date;
  to?: Date;
  locationId?: string;
  professionalId?: string;
  status?: AdminCalendarStatus;
}

export async function getAdminCalendar(
  businessSlug: string,
  query: AdminCalendarQuery = {},
): Promise<AdminCalendarLoadState> {
  const config = await getAuthenticatedAdminApiConfig(businessSlug);

  const range = query.from && query.to
    ? { from: query.from, to: query.to }
    : getDefaultCalendarRange();

  try {
    const endpoint = buildCalendarUrl(
      config.apiUrl,
      config.businessSlug,
      range.from,
      range.to,
      query,
    );
    const response = await fetch(endpoint, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      logAdminCalendarLoadError(new AdminCalendarLoadError(
        `Admin calendar API request failed with status ${response.status}.`,
        response.status,
      ));

      if (response.status === 401) {
        return {
          status: "missing-config",
          message: ADMIN_CALENDAR_AUTH_MESSAGE,
        };
      }

      return {
        status: "error",
        httpStatus: response.status,
        debugBlock: "calendar",
        message: "No pudimos cargar la agenda. Intenta nuevamente.",
      };
    }

    let data: AdminCalendarResponse;
    try {
      data = await response.json() as AdminCalendarResponse;
    } catch {
      throw new AdminCalendarLoadError("Admin calendar API returned invalid JSON.");
    }

    return {
      status: "ready",
      data,
    };
  } catch (error) {
    logAdminCalendarLoadError(error);

    return {
      status: "error",
      debugBlock: "calendar",
      message: "No pudimos cargar la agenda. Intenta nuevamente.",
    };
  }
}

export async function updateAdminAppointmentStatus(input: {
  businessSlug: string;
  appointmentId: string;
  status: AdminAppointmentTargetStatus;
}): Promise<AdminAppointmentStatusResult> {
  const config = await getAuthenticatedAdminApiConfig(input.businessSlug);

  try {
    const response = await fetch(
      `${config.apiUrl}/businesses/${config.businessSlug}/appointments/${encodeURIComponent(input.appointmentId)}/status`,
      {
        method: "PATCH",
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${config.token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: input.status,
          ...(input.status === "CANCELLED" ? { cancellationSource: "ADMIN" } : {}),
        }),
      },
    );
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const code = typeof (payload as { code?: unknown }).code === "string"
        ? (payload as { code: string }).code
        : "APPOINTMENT_STATUS_UPDATE_FAILED";
      return {
        ok: false,
        code,
        message: mapStatusError(code),
      };
    }

    return {
      ok: true,
      appointment: requireCalendarAppointment(payload),
    };
  } catch (error) {
    logAdminCalendarLoadError(error);
    return {
      ok: false,
      code: "APPOINTMENT_STATUS_UPDATE_FAILED",
      message: "No pudimos actualizar la cita. Intenta nuevamente.",
    };
  }
}

function buildCalendarUrl(
  apiUrl: string,
  businessSlug: string,
  from: Date,
  to: Date,
  query: AdminCalendarQuery,
): string {
  const normalizedApiUrl = apiUrl.replace(/\/+$/, "");
  const url = new URL(`${normalizedApiUrl}/businesses/${businessSlug}/dashboard/calendar`);
  url.searchParams.set("from", from.toISOString());
  url.searchParams.set("to", to.toISOString());
  if (query.locationId) {
    url.searchParams.set("locationId", query.locationId);
  }
  if (query.professionalId) {
    url.searchParams.set("professionalId", query.professionalId);
  }
  if (query.status) {
    url.searchParams.set("status", query.status);
  }

  return url.toString();
}

function requireCalendarAppointment(payload: unknown): AdminCalendarAppointment {
  if (!payload || typeof payload !== "object") {
    throw new AdminCalendarLoadError("Admin appointment payload is invalid.");
  }

  const value = payload as Partial<AdminCalendarAppointment>;
  if (typeof value.id !== "string"
    || !isCalendarStatus(value.status)
    || typeof value.startAt !== "string"
    || typeof value.endAt !== "string"
    || !value.customer
    || !value.location
    || !Array.isArray(value.services)
    || !Array.isArray(value.professionals)
    || !Array.isArray(value.segments)) {
    throw new AdminCalendarLoadError("Admin appointment payload has invalid shape.");
  }

  return {
    ...value,
    localDate: typeof value.localDate === "string"
      ? value.localDate
      : new Intl.DateTimeFormat("en-CA", {
          timeZone: DEFAULT_TIME_ZONE,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date(value.startAt)),
  } as AdminCalendarAppointment;
}

function isCalendarStatus(value: unknown): value is AdminCalendarStatus {
  return value === "CONFIRMED"
    || value === "COMPLETED"
    || value === "CANCELLED"
    || value === "NO_SHOW";
}

function mapStatusError(code: string): string {
  const messages: Record<string, string> = {
    APPOINTMENT_NOT_FOUND: "La cita ya no está disponible.",
    APPOINTMENT_STATUS_INVALID_INPUT: "No pudimos aplicar ese cambio de estado.",
    APPOINTMENT_STATUS_TRANSITION_INVALID: "El estado de la cita cambió. Actualiza la agenda e intenta nuevamente.",
  };

  return messages[code] ?? "No pudimos actualizar la cita. Intenta nuevamente.";
}

function getDefaultCalendarRange(): { from: Date; to: Date } {
  const from = startOfCurrentDayInTimeZone(DEFAULT_TIME_ZONE);
  const to = new Date(from.getTime() + (DEFAULT_RANGE_DAYS * MILLISECONDS_PER_DAY));

  return { from, to };
}

function startOfCurrentDayInTimeZone(timeZone: string): Date {
  const now = new Date();
  const parts = getDatePartsInTimeZone(now, timeZone);

  return localDateTimeToUtc(Number(parts.year), Number(parts.month), Number(parts.day), timeZone);
}

function localDateTimeToUtc(
  year: number,
  month: number,
  day: number,
  timeZone: string,
): Date {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  const firstOffset = getTimezoneOffsetMilliseconds(utcGuess, timeZone);
  const firstCandidate = new Date(utcGuess.getTime() - firstOffset);
  const secondOffset = getTimezoneOffsetMilliseconds(firstCandidate, timeZone);

  return new Date(utcGuess.getTime() - secondOffset);
}

function getTimezoneOffsetMilliseconds(date: Date, timeZone: string): number {
  const parts = getDateTimePartsInTimeZone(date, timeZone);
  const utcTime = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );

  return utcTime - date.getTime();
}

function getDatePartsInTimeZone(
  date: Date,
  timeZone: string,
): Record<"year" | "month" | "day", string> {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  return partsToRecord(parts, ["year", "month", "day"]);
}

function getDateTimePartsInTimeZone(
  date: Date,
  timeZone: string,
): Record<"year" | "month" | "day" | "hour" | "minute" | "second", string> {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);

  return partsToRecord(parts, ["year", "month", "day", "hour", "minute", "second"]);
}

function partsToRecord<T extends string>(
  parts: Intl.DateTimeFormatPart[],
  names: T[],
): Record<T, string> {
  return Object.fromEntries(
    names.map((name) => [
      name,
      parts.find((part) => part.type === name)?.value ?? "00",
    ]),
  ) as Record<T, string>;
}

function logAdminCalendarLoadError(error: unknown) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const message = error instanceof Error ? error.message : "Error desconocido.";
  const status = error instanceof AdminCalendarLoadError && error.status
    ? ` status=${error.status}`
    : "";

  console.warn(`[admin/citas] Fallo controlado en calendar:${status} ${message}`);
}
