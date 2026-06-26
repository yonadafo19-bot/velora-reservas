import type { BusinessVertical } from "@/types/demo";
import type { AdminCalendarLoadState, AdminCalendarResponse } from "@/types/admin-calendar";

const DEFAULT_TIME_ZONE = "America/Santiago";
const DEFAULT_RANGE_DAYS = 7;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const ADMIN_CALENDAR_AUTH_MESSAGE = "Configuración o sesión pendiente. No pudimos cargar la agenda real. Revisa la sesión de administrador.";

const businessSlugByVertical: Record<BusinessVertical, string> = {
  barberia: "velora-barberia-demo",
  belleza: "velora-beauty-studio-demo",
};

class AdminCalendarLoadError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "AdminCalendarLoadError";
  }
}

export async function getAdminCalendar(
  vertical: BusinessVertical,
): Promise<AdminCalendarLoadState> {
  const apiUrl = process.env.VELORA_API_URL;
  const token = process.env.VELORA_ADMIN_DEV_TOKEN;

  if (!apiUrl || !token) {
    return {
      status: "missing-config",
      message: ADMIN_CALENDAR_AUTH_MESSAGE,
    };
  }

  const { from, to } = getDefaultCalendarRange();

  try {
    const endpoint = buildCalendarUrl(apiUrl, businessSlugByVertical[vertical], from, to);
    const response = await fetch(endpoint, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
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

function buildCalendarUrl(
  apiUrl: string,
  businessSlug: string,
  from: Date,
  to: Date,
): string {
  const normalizedApiUrl = apiUrl.replace(/\/+$/, "");
  const url = new URL(`${normalizedApiUrl}/businesses/${businessSlug}/dashboard/calendar`);
  url.searchParams.set("from", from.toISOString());
  url.searchParams.set("to", to.toISOString());

  return url.toString();
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
