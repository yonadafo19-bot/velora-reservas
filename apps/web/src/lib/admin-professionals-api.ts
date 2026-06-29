import type { BusinessVertical } from "@/types/demo";

const ADMIN_PROFESSIONALS_AUTH_MESSAGE = "Configuracion o sesion pendiente. No pudimos cargar profesionales reales. Revisa la sesion de administrador.";

const businessSlugByVertical: Record<BusinessVertical, string> = {
  barberia: "velora-barberia-demo",
  belleza: "velora-beauty-studio-demo",
};

export type AdminProfessionalStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

export interface AdminProfessionalServiceOption {
  id: string;
  name: string;
}

export interface AdminProfessionalAssignableService extends AdminProfessionalServiceOption {
  isActive: boolean;
}

export type AdminProfessionalLocationStatus = "ACTIVE" | "INACTIVE";

export interface AdminProfessionalLocationOption {
  id: string;
  slug: string;
  name: string;
  addressLine: string | null;
  city: string | null;
  status: AdminProfessionalLocationStatus;
}

export interface AdminProfessional {
  id: string;
  slug: string;
  displayName: string;
  roleTitle: string | null;
  bio: string | null;
  status: AdminProfessionalStatus;
  isActive: boolean;
  sortOrder: number;
  services: AdminProfessionalServiceOption[];
  locations: AdminProfessionalLocationOption[];
}

export interface AdminProfessionalMutationInput {
  businessSlug: string;
  professionalId?: string;
  displayName: string;
  roleTitle: string | null;
  bio: string | null;
  phone?: string | null;
  email?: string | null;
  status: AdminProfessionalStatus;
}

export interface AdminProfessionalServicesInput {
  businessSlug: string;
  professionalId: string;
  serviceIds: string[];
}

export interface AdminProfessionalLocationsInput {
  businessSlug: string;
  professionalId: string;
  locationIds: string[];
}

export type AdminProfessionalsLoadState =
  | {
      status: "REAL_CONNECTED";
      businessSlug: string;
      professionals: AdminProfessional[];
      services: AdminProfessionalAssignableService[];
      locations: AdminProfessionalLocationOption[];
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

export type AdminProfessionalMutationResult =
  | {
      ok: true;
      professional: AdminProfessional;
    }
  | {
      ok: false;
      code: string;
      message: string;
    };

interface AdminApiConfig {
  apiUrl: string;
  token: string;
}

interface ApiErrorResponse {
  code?: string;
  message?: string;
}

class AdminProfessionalsLoadError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "AdminProfessionalsLoadError";
  }
}

export async function getAdminProfessionalsData(
  vertical: BusinessVertical,
): Promise<AdminProfessionalsLoadState> {
  const config = getAdminApiConfig();
  if (!config.ok) {
    return {
      status: "MISSING_CONFIG",
      message: config.message,
    };
  }

  const businessSlug = businessSlugByVertical[vertical];

  try {
    const [professionalsPayload, servicesPayload, locationsPayload] = await Promise.all([
      getAdminApi<unknown>(config, `/businesses/${businessSlug}/professionals`),
      getAdminApi<unknown>(config, `/businesses/${businessSlug}/services`),
      getAdminApi<unknown>(config, `/businesses/${businessSlug}/locations`),
    ]);

    return {
      status: "REAL_CONNECTED",
      businessSlug,
      professionals: requireProfessionals(professionalsPayload),
      services: requireAssignableServices(servicesPayload),
      locations: requireLocations(locationsPayload),
    };
  } catch (error) {
    logAdminProfessionalsError(error);

    if (error instanceof AdminProfessionalsLoadError && error.status === 401) {
      return {
        status: "MISSING_CONFIG",
        message: ADMIN_PROFESSIONALS_AUTH_MESSAGE,
      };
    }

    return {
      status: "API_ERROR",
      message: "No pudimos cargar profesionales reales. Intenta nuevamente.",
      httpStatus: error instanceof AdminProfessionalsLoadError ? error.status : undefined,
    };
  }
}

export async function createAdminProfessional(
  input: AdminProfessionalMutationInput,
): Promise<AdminProfessionalMutationResult> {
  const config = getAdminApiConfig();
  if (!config.ok) {
    return {
      ok: false,
      code: "ADMIN_PROFESSIONALS_CONFIG_MISSING",
      message: config.message,
    };
  }

  return mutateAdminProfessional(
    config,
    `/businesses/${input.businessSlug}/professionals`,
    "POST",
    toProfessionalPayload(input),
  );
}

export async function updateAdminProfessional(
  input: AdminProfessionalMutationInput & { professionalId: string },
): Promise<AdminProfessionalMutationResult> {
  const config = getAdminApiConfig();
  if (!config.ok) {
    return {
      ok: false,
      code: "ADMIN_PROFESSIONALS_CONFIG_MISSING",
      message: config.message,
    };
  }

  return mutateAdminProfessional(
    config,
    `/businesses/${input.businessSlug}/professionals/${input.professionalId}`,
    "PATCH",
    toProfessionalPayload(input),
  );
}

export async function updateAdminProfessionalServices(
  input: AdminProfessionalServicesInput,
): Promise<AdminProfessionalMutationResult> {
  const config = getAdminApiConfig();
  if (!config.ok) {
    return {
      ok: false,
      code: "ADMIN_PROFESSIONALS_CONFIG_MISSING",
      message: config.message,
    };
  }

  return mutateAdminProfessional(
    config,
    `/businesses/${input.businessSlug}/professionals/${input.professionalId}/services`,
    "PUT",
    { serviceIds: input.serviceIds },
  );
}

export async function updateAdminProfessionalLocations(
  input: AdminProfessionalLocationsInput,
): Promise<AdminProfessionalMutationResult> {
  const config = getAdminApiConfig();
  if (!config.ok) {
    return {
      ok: false,
      code: "ADMIN_PROFESSIONALS_CONFIG_MISSING",
      message: config.message,
    };
  }

  return mutateAdminProfessional(
    config,
    `/businesses/${input.businessSlug}/professionals/${input.professionalId}/locations`,
    "PUT",
    { locationIds: input.locationIds },
  );
}

async function mutateAdminProfessional(
  config: AdminApiConfig,
  path: string,
  method: "POST" | "PATCH" | "PUT",
  body: Record<string, unknown>,
): Promise<AdminProfessionalMutationResult> {
  try {
    const response = await fetch(`${config.apiUrl}${path}`, {
      method,
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
        : "ADMIN_PROFESSIONAL_SAVE_FAILED";

      return {
        ok: false,
        code,
        message: mapAdminProfessionalError(code),
      };
    }

    return {
      ok: true,
      professional: requireProfessional(payload),
    };
  } catch (error) {
    logAdminProfessionalsError(error);

    return {
      ok: false,
      code: "ADMIN_PROFESSIONAL_SAVE_FAILED",
      message: "No pudimos guardar el profesional. Intenta nuevamente.",
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
    throw new AdminProfessionalsLoadError(
      `Admin professionals API request failed with status ${response.status}.`,
      response.status,
    );
  }

  try {
    return await response.json() as T;
  } catch {
    throw new AdminProfessionalsLoadError("Admin professionals API returned invalid JSON.");
  }
}

function toProfessionalPayload(input: AdminProfessionalMutationInput) {
  const payload: Record<string, unknown> = {
    displayName: input.displayName,
    roleTitle: input.roleTitle,
    bio: input.bio,
    status: input.status,
  };

  if (input.phone !== undefined) {
    payload.phone = input.phone;
  }

  if (input.email !== undefined) {
    payload.email = input.email;
  }

  return payload;
}

function requireProfessionals(payload: unknown): AdminProfessional[] {
  if (!Array.isArray(payload)) {
    throw new AdminProfessionalsLoadError("Admin professionals payload is not an array.");
  }

  return payload.map(requireProfessional);
}

function requireProfessional(payload: unknown): AdminProfessional {
  if (!payload || typeof payload !== "object") {
    throw new AdminProfessionalsLoadError("Admin professional payload is not an object.");
  }

  const value = payload as Partial<AdminProfessional>;

  if (!isNonEmptyString(value.id)
    || !isNonEmptyString(value.displayName)
    || !isAdminProfessionalStatus(value.status)
    || !Array.isArray(value.services)) {
    throw new AdminProfessionalsLoadError("Admin professional payload has invalid shape.");
  }

  return {
    id: value.id,
    slug: typeof value.slug === "string" ? value.slug : "",
    displayName: value.displayName,
    roleTitle: typeof value.roleTitle === "string" ? value.roleTitle : null,
    bio: typeof value.bio === "string" ? value.bio : null,
    status: value.status,
    isActive: value.status === "ACTIVE",
    sortOrder: getIntegerOrDefault(value.sortOrder, 0),
    services: value.services.map(requireProfessionalService),
    locations: Array.isArray(value.locations) ? value.locations.map(requireLocation) : [],
  };
}

function requireProfessionalService(payload: unknown): AdminProfessionalServiceOption {
  if (!payload || typeof payload !== "object") {
    throw new AdminProfessionalsLoadError("Admin professional service payload is not an object.");
  }

  const value = payload as Partial<AdminProfessionalServiceOption>;

  if (!isNonEmptyString(value.id) || !isNonEmptyString(value.name)) {
    throw new AdminProfessionalsLoadError("Admin professional service payload has invalid shape.");
  }

  return {
    id: value.id,
    name: value.name,
  };
}

function requireAssignableServices(payload: unknown): AdminProfessionalAssignableService[] {
  if (!Array.isArray(payload)) {
    throw new AdminProfessionalsLoadError("Admin services payload is not an array.");
  }

  return payload.map(requireAssignableService).filter((service) => service.isActive);
}

function requireAssignableService(payload: unknown): AdminProfessionalAssignableService {
  if (!payload || typeof payload !== "object") {
    throw new AdminProfessionalsLoadError("Admin assignable service payload is not an object.");
  }

  const value = payload as Partial<AdminProfessionalAssignableService> & {
    status?: unknown;
  };

  if (!isNonEmptyString(value.id) || !isNonEmptyString(value.name)) {
    throw new AdminProfessionalsLoadError("Admin assignable service payload has invalid shape.");
  }

  return {
    id: value.id,
    name: value.name,
    isActive: value.isActive === true || value.status === "ACTIVE",
  };
}

function requireLocations(payload: unknown): AdminProfessionalLocationOption[] {
  if (!Array.isArray(payload)) {
    throw new AdminProfessionalsLoadError("Admin locations payload is not an array.");
  }

  return payload.map(requireLocation).filter((location) => location.status === "ACTIVE");
}

function requireLocation(payload: unknown): AdminProfessionalLocationOption {
  if (!payload || typeof payload !== "object") {
    throw new AdminProfessionalsLoadError("Admin location payload is not an object.");
  }

  const value = payload as Partial<AdminProfessionalLocationOption>;

  if (!isNonEmptyString(value.id)
    || !isNonEmptyString(value.name)
    || !isAdminProfessionalLocationStatus(value.status)) {
    throw new AdminProfessionalsLoadError("Admin location payload has invalid shape.");
  }

  return {
    id: value.id,
    slug: typeof value.slug === "string" ? value.slug : "",
    name: value.name,
    addressLine: typeof value.addressLine === "string" ? value.addressLine : null,
    city: typeof value.city === "string" ? value.city : null,
    status: value.status,
  };
}

function getAdminApiConfig():
  | { ok: true; apiUrl: string; token: string }
  | { ok: false; message: string } {
  const apiUrl = process.env.VELORA_API_URL?.replace(/\/+$/, "");
  const token = process.env.VELORA_ADMIN_DEV_TOKEN;

  if (!apiUrl || !token) {
    return {
      ok: false,
      message: ADMIN_PROFESSIONALS_AUTH_MESSAGE,
    };
  }

  return {
    ok: true,
    apiUrl,
    token,
  };
}

function mapAdminProfessionalError(code: string): string {
  const messages: Record<string, string> = {
    ADMIN_PROFESSIONAL_INVALID_INPUT: "Revisa los datos del profesional.",
    ADMIN_PROFESSIONAL_SLUG_DUPLICATED: "Ya existe un profesional con ese nombre o slug.",
    ADMIN_PROFESSIONAL_NOT_FOUND: "El profesional no existe en este negocio.",
    ADMIN_PROFESSIONAL_SERVICES_INVALID_INPUT: "Revisa los servicios asignados.",
    ADMIN_PROFESSIONAL_SERVICES_DUPLICATED: "No repitas servicios para el mismo profesional.",
    ADMIN_PROFESSIONAL_SERVICE_INVALID: "Uno o mas servicios no estan disponibles para este negocio.",
    ADMIN_PROFESSIONAL_LOCATIONS_INVALID_INPUT: "Revisa las sucursales asignadas.",
    ADMIN_PROFESSIONAL_LOCATIONS_DUPLICATED: "No repitas sucursales para el mismo profesional.",
    ADMIN_PROFESSIONAL_LOCATION_INVALID: "Una o mas sucursales no estan disponibles para este negocio.",
    TENANT_BUSINESS_MISMATCH: "No tienes acceso a este negocio.",
  };

  return messages[code] ?? "No pudimos guardar el profesional. Intenta nuevamente.";
}

function logAdminProfessionalsError(error: unknown) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const message = error instanceof Error ? error.message : "Error desconocido.";
  const status = error instanceof AdminProfessionalsLoadError && error.status
    ? ` status=${error.status}`
    : "";

  console.warn(`[admin/profesionales] Fallo controlado:${status} ${message}`);
}

function isAdminProfessionalStatus(value: unknown): value is AdminProfessionalStatus {
  return value === "ACTIVE" || value === "INACTIVE" || value === "ARCHIVED";
}

function isAdminProfessionalLocationStatus(value: unknown): value is AdminProfessionalLocationStatus {
  return value === "ACTIVE" || value === "INACTIVE";
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function getIntegerOrDefault(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isInteger(value) ? value : fallback;
}
