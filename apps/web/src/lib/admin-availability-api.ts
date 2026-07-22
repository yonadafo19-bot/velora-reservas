import { getAuthenticatedAdminApiConfig, type AdminApiConfig } from "@/lib/admin-api";

const ADMIN_AVAILABILITY_AUTH_MESSAGE = "Configuracion o sesion pendiente. No pudimos cargar horarios reales. Revisa la sesion de administrador.";

export type AdminAvailabilityStatus = "ACTIVE" | "INACTIVE";
export type AdminAvailabilityWeekday =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export interface AdminAvailabilityProfessional {
  id: string;
  displayName: string;
  roleTitle: string | null;
  isActive: boolean;
}

export interface AdminAvailabilityLocation {
  id: string;
  slug: string;
  name: string;
  timezone: string;
  status: string;
}

export interface AdminBusinessHourInput {
  locationId?: string | null;
  weekday: AdminAvailabilityWeekday;
  opensAtLocal: string;
  closesAtLocal: string;
  status: AdminAvailabilityStatus;
}

export interface AdminBusinessHour extends AdminBusinessHourInput {
  id: string;
  locationId: string | null;
}

export interface AdminProfessionalAvailabilityRuleInput {
  locationId: string;
  weekday: AdminAvailabilityWeekday;
  startsAtLocal: string;
  endsAtLocal: string;
  status: AdminAvailabilityStatus;
}

export interface AdminProfessionalAvailabilityRule extends AdminProfessionalAvailabilityRuleInput {
  id: string;
}

export interface AdminAvailabilityTimeOff {
  id: string;
  locationId: string | null;
  startsAt: string;
  endsAt: string;
  status: string;
}

export interface AdminAvailabilityData {
  businessSlug: string;
  selectedProfessionalId: string;
  professionals: AdminAvailabilityProfessional[];
  locations: AdminAvailabilityLocation[];
  selectedLocationId: string | null;
  businessTimezone: string;
  businessHours: AdminBusinessHour[];
  weeklyRules: AdminProfessionalAvailabilityRule[];
  timeOff: AdminAvailabilityTimeOff[];
}

export type AdminAvailabilityLoadState =
  | {
      status: "REAL_CONNECTED";
      data: AdminAvailabilityData;
    }
  | {
      status: "NEEDS_PROFESSIONALS";
      businessSlug: string;
      message: string;
    }
  | {
      status: "NEEDS_LOCATION";
      data: AdminAvailabilityData;
      message: string;
    }
  | {
      status: "MISSING_CONFIG";
      message: string;
    }
  | {
      status: "API_ERROR";
      message: string;
      httpStatus?: number;
    };

export type AdminAvailabilityMutationResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      code: string;
      message: string;
    };

export interface AdminBusinessHoursMutationInput {
  businessSlug: string;
  hours: AdminBusinessHourInput[];
}

export interface AdminProfessionalAvailabilityMutationInput {
  businessSlug: string;
  professionalId: string;
  rules: AdminProfessionalAvailabilityRuleInput[];
}

interface ApiErrorResponse {
  code?: string;
  message?: string;
}

interface AvailabilityPayload {
  professional?: {
    id?: unknown;
    displayName?: unknown;
    roleTitle?: unknown;
    isActive?: unknown;
  };
  timezone?: {
    business?: unknown;
  };
  locations?: unknown;
  businessHours?: unknown;
  weeklyRules?: unknown;
  timeOff?: unknown;
}

class AdminAvailabilityLoadError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "AdminAvailabilityLoadError";
  }
}

export async function getAdminAvailabilityData(
  businessSlug: string,
  requestedProfessionalId?: string,
): Promise<AdminAvailabilityLoadState> {
  const config = await getAuthenticatedAdminApiConfig(businessSlug);

  try {
    const professionalsPayload = await getAdminApi<unknown>(
      config,
      `/businesses/${businessSlug}/professionals`,
    );
    const professionals = requireProfessionals(professionalsPayload).filter(
      (professional) => professional.isActive,
    );

    if (professionals.length === 0) {
      return {
        status: "NEEDS_PROFESSIONALS",
        businessSlug,
        message: "Crea o activa profesionales antes de configurar disponibilidad real.",
      };
    }

    const selectedProfessionalId = professionals.some((professional) => professional.id === requestedProfessionalId)
      ? requestedProfessionalId!
      : professionals[0].id;
    const availabilityPayload = await getAdminApi<unknown>(
      config,
      `/businesses/${businessSlug}/professionals/${selectedProfessionalId}/availability`,
    );
    const data = normalizeAvailabilityPayload(businessSlug, professionals, availabilityPayload);

    if (!data.selectedLocationId) {
      return {
        status: "NEEDS_LOCATION",
        data,
        message: "El profesional seleccionado no tiene sucursales activas para guardar disponibilidad.",
      };
    }

    return {
      status: "REAL_CONNECTED",
      data,
    };
  } catch (error) {
    logAdminAvailabilityError(error);

    if (error instanceof AdminAvailabilityLoadError && error.status === 401) {
      return {
        status: "MISSING_CONFIG",
        message: ADMIN_AVAILABILITY_AUTH_MESSAGE,
      };
    }

    return {
      status: "API_ERROR",
      message: "No pudimos cargar horarios reales. Intenta nuevamente.",
      httpStatus: error instanceof AdminAvailabilityLoadError ? error.status : undefined,
    };
  }
}

export async function updateBusinessHours(
  input: AdminBusinessHoursMutationInput,
): Promise<AdminAvailabilityMutationResult> {
  const config = await getAuthenticatedAdminApiConfig(input.businessSlug);

  return mutateAvailability(config, `/businesses/${input.businessSlug}/business-hours`, {
    hours: input.hours,
  });
}

export async function updateProfessionalAvailability(
  input: AdminProfessionalAvailabilityMutationInput,
): Promise<AdminAvailabilityMutationResult> {
  const config = await getAuthenticatedAdminApiConfig(input.businessSlug);

  return mutateAvailability(
    config,
    `/businesses/${input.businessSlug}/professionals/${input.professionalId}/availability`,
    { rules: input.rules },
  );
}

async function mutateAvailability(
  config: AdminApiConfig,
  path: string,
  body: Record<string, unknown>,
): Promise<AdminAvailabilityMutationResult> {
  try {
    const response = await fetch(`${config.apiUrl}${path}`, {
      method: "PUT",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const code = typeof (payload as ApiErrorResponse).code === "string"
        ? (payload as ApiErrorResponse).code!
        : "ADMIN_AVAILABILITY_SAVE_FAILED";

      return {
        ok: false,
        code,
        message: mapAdminAvailabilityError(code),
      };
    }

    return { ok: true };
  } catch (error) {
    logAdminAvailabilityError(error);

    return {
      ok: false,
      code: "ADMIN_AVAILABILITY_SAVE_FAILED",
      message: "No pudimos guardar los horarios. Intenta nuevamente.",
    };
  }
}

async function getAdminApi<T>(
  config: AdminApiConfig,
  path: string,
): Promise<T> {
  const response = await fetch(`${config.apiUrl}${path}`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new AdminAvailabilityLoadError(
      `Admin availability API request failed with status ${response.status}.`,
      response.status,
    );
  }

  try {
    return await response.json() as T;
  } catch {
    throw new AdminAvailabilityLoadError("Admin availability API returned invalid JSON.");
  }
}

function normalizeAvailabilityPayload(
  businessSlug: string,
  professionals: AdminAvailabilityProfessional[],
  payload: unknown,
): AdminAvailabilityData {
  if (!payload || typeof payload !== "object") {
    throw new AdminAvailabilityLoadError("Admin availability payload is not an object.");
  }

  const value = payload as AvailabilityPayload;
  const professional = value.professional;

  if (!professional
    || !isNonEmptyString(professional.id)
    || !isNonEmptyString(professional.displayName)) {
    throw new AdminAvailabilityLoadError("Admin availability professional payload has invalid shape.");
  }

  const locations = requireLocations(value.locations);

  return {
    businessSlug,
    selectedProfessionalId: professional.id,
    professionals,
    locations,
    selectedLocationId: locations[0]?.id ?? null,
    businessTimezone: typeof value.timezone?.business === "string" ? value.timezone.business : "America/Santiago",
    businessHours: requireBusinessHours(value.businessHours),
    weeklyRules: requireWeeklyRules(value.weeklyRules),
    timeOff: requireTimeOff(value.timeOff),
  };
}

function requireProfessionals(payload: unknown): AdminAvailabilityProfessional[] {
  if (!Array.isArray(payload)) {
    throw new AdminAvailabilityLoadError("Admin professionals payload is not an array.");
  }

  return payload.map((item) => {
    if (!item || typeof item !== "object") {
      throw new AdminAvailabilityLoadError("Admin professional payload is not an object.");
    }

    const value = item as Partial<AdminAvailabilityProfessional>;

    if (!isNonEmptyString(value.id)
      || !isNonEmptyString(value.displayName)
      || typeof value.isActive !== "boolean") {
      throw new AdminAvailabilityLoadError("Admin professional payload has invalid shape.");
    }

    return {
      id: value.id,
      displayName: value.displayName,
      roleTitle: typeof value.roleTitle === "string" ? value.roleTitle : null,
      isActive: value.isActive,
    };
  });
}

function requireLocations(payload: unknown): AdminAvailabilityLocation[] {
  if (!Array.isArray(payload)) {
    throw new AdminAvailabilityLoadError("Admin locations payload is not an array.");
  }

  return payload.map((item) => {
    if (!item || typeof item !== "object") {
      throw new AdminAvailabilityLoadError("Admin location payload is not an object.");
    }

    const value = item as Partial<AdminAvailabilityLocation>;

    if (!isNonEmptyString(value.id)
      || !isNonEmptyString(value.name)
      || !isNonEmptyString(value.status)) {
      throw new AdminAvailabilityLoadError("Admin location payload has invalid shape.");
    }

    return {
      id: value.id,
      slug: typeof value.slug === "string" ? value.slug : "",
      name: value.name,
      timezone: typeof value.timezone === "string" ? value.timezone : "America/Santiago",
      status: value.status,
    };
  }).filter((location) => location.status === "ACTIVE");
}

function requireBusinessHours(payload: unknown): AdminBusinessHour[] {
  if (!Array.isArray(payload)) {
    throw new AdminAvailabilityLoadError("Admin business hours payload is not an array.");
  }

  return payload.map((item) => {
    if (!item || typeof item !== "object") {
      throw new AdminAvailabilityLoadError("Admin business hour payload is not an object.");
    }

    const value = item as Partial<AdminBusinessHour>;

    if (!isNonEmptyString(value.id)
      || !isWeekday(value.weekday)
      || !isTimeString(value.opensAtLocal)
      || !isTimeString(value.closesAtLocal)
      || !isAvailabilityStatus(value.status)) {
      throw new AdminAvailabilityLoadError("Admin business hour payload has invalid shape.");
    }

    return {
      id: value.id,
      locationId: typeof value.locationId === "string" ? value.locationId : null,
      weekday: value.weekday,
      opensAtLocal: value.opensAtLocal,
      closesAtLocal: value.closesAtLocal,
      status: value.status,
    };
  });
}

function requireWeeklyRules(payload: unknown): AdminProfessionalAvailabilityRule[] {
  if (!Array.isArray(payload)) {
    throw new AdminAvailabilityLoadError("Admin weekly rules payload is not an array.");
  }

  return payload.map((item) => {
    if (!item || typeof item !== "object") {
      throw new AdminAvailabilityLoadError("Admin weekly rule payload is not an object.");
    }

    const value = item as Partial<AdminProfessionalAvailabilityRule>;

    if (!isNonEmptyString(value.id)
      || !isNonEmptyString(value.locationId)
      || !isWeekday(value.weekday)
      || !isTimeString(value.startsAtLocal)
      || !isTimeString(value.endsAtLocal)
      || !isAvailabilityStatus(value.status)) {
      throw new AdminAvailabilityLoadError("Admin weekly rule payload has invalid shape.");
    }

    return {
      id: value.id,
      locationId: value.locationId,
      weekday: value.weekday,
      startsAtLocal: value.startsAtLocal,
      endsAtLocal: value.endsAtLocal,
      status: value.status,
    };
  });
}

function requireTimeOff(payload: unknown): AdminAvailabilityTimeOff[] {
  if (!Array.isArray(payload)) {
    throw new AdminAvailabilityLoadError("Admin time off payload is not an array.");
  }

  return payload.map((item) => {
    if (!item || typeof item !== "object") {
      throw new AdminAvailabilityLoadError("Admin time off payload is not an object.");
    }

    const value = item as Partial<AdminAvailabilityTimeOff>;

    if (!isNonEmptyString(value.id)
      || !isNonEmptyString(value.startsAt)
      || !isNonEmptyString(value.endsAt)
      || !isNonEmptyString(value.status)) {
      throw new AdminAvailabilityLoadError("Admin time off payload has invalid shape.");
    }

    return {
      id: value.id,
      locationId: typeof value.locationId === "string" ? value.locationId : null,
      startsAt: value.startsAt,
      endsAt: value.endsAt,
      status: value.status,
    };
  });
}

function mapAdminAvailabilityError(code: string): string {
  const messages: Record<string, string> = {
    ADMIN_AVAILABILITY_INVALID_INPUT: "Revisa los dias y horarios ingresados.",
    ADMIN_LOCATION_INVALID: "Una o mas sucursales no estan disponibles para este negocio.",
    ADMIN_PROFESSIONAL_NOT_FOUND: "El profesional no existe en este negocio.",
    TENANT_BUSINESS_MISMATCH: "No tienes acceso a este negocio.",
  };

  return messages[code] ?? "No pudimos guardar los horarios. Intenta nuevamente.";
}

function logAdminAvailabilityError(error: unknown) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const message = error instanceof Error ? error.message : "Error desconocido.";
  const status = error instanceof AdminAvailabilityLoadError && error.status
    ? ` status=${error.status}`
    : "";

  console.warn(`[admin/horarios] Fallo controlado:${status} ${message}`);
}

function isWeekday(value: unknown): value is AdminAvailabilityWeekday {
  return value === "MONDAY"
    || value === "TUESDAY"
    || value === "WEDNESDAY"
    || value === "THURSDAY"
    || value === "FRIDAY"
    || value === "SATURDAY"
    || value === "SUNDAY";
}

function isAvailabilityStatus(value: unknown): value is AdminAvailabilityStatus {
  return value === "ACTIVE" || value === "INACTIVE";
}

function isTimeString(value: unknown): value is string {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
