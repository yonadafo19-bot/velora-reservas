import { getAuthenticatedAdminApiConfig, type AdminApiConfig } from "@/lib/admin-api";

const ADMIN_SERVICES_AUTH_MESSAGE = "No pudimos cargar los servicios. Revisa tu sesión e intenta nuevamente.";

export type AdminServiceStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

export interface AdminService {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  priceFrom: number;
  priceTo: number;
  currency: string;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  categoryId: string | null;
  categoryName: string | null;
  status: AdminServiceStatus;
  isActive: boolean;
  isMainService: boolean;
  sortOrder: number;
}

export interface AdminServiceMutationInput {
  businessSlug: string;
  serviceId?: string;
  name: string;
  description: string | null;
  basePriceClp: number;
  durationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  status: AdminServiceStatus;
}

export type AdminServicesLoadState =
  | {
      status: "REAL_CONNECTED";
      businessSlug: string;
      services: AdminService[];
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

export type AdminServiceMutationResult =
  | {
      ok: true;
      service: AdminService;
    }
  | {
      ok: false;
      code: string;
      message: string;
    };

interface ApiErrorResponse {
  code?: string;
  message?: string;
}

class AdminServicesLoadError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "AdminServicesLoadError";
  }
}

export async function getAdminServicesData(
  businessSlug: string,
): Promise<AdminServicesLoadState> {
  const config = await getAuthenticatedAdminApiConfig(businessSlug);

  try {
    const payload = await getAdminApi<unknown>(
      config,
      `/businesses/${businessSlug}/services`,
    );

    return {
      status: "REAL_CONNECTED",
      businessSlug,
      services: requireServices(payload),
    };
  } catch (error) {
    logAdminServicesError(error);

    if (error instanceof AdminServicesLoadError && error.status === 401) {
      return {
        status: "MISSING_CONFIG",
        message: ADMIN_SERVICES_AUTH_MESSAGE,
      };
    }

    return {
      status: "API_ERROR",
      message: "No pudimos cargar los servicios. Intenta nuevamente.",
      httpStatus: error instanceof AdminServicesLoadError ? error.status : undefined,
    };
  }
}

export async function createAdminService(
  input: AdminServiceMutationInput,
): Promise<AdminServiceMutationResult> {
  const config = await getAuthenticatedAdminApiConfig(input.businessSlug);

  return mutateAdminService(
    config,
    `/businesses/${input.businessSlug}/services`,
    "POST",
    toServicePayload(input),
  );
}

export async function updateAdminService(
  input: AdminServiceMutationInput & { serviceId: string },
): Promise<AdminServiceMutationResult> {
  const config = await getAuthenticatedAdminApiConfig(input.businessSlug);

  return mutateAdminService(
    config,
    `/businesses/${input.businessSlug}/services/${input.serviceId}`,
    "PATCH",
    toServicePayload(input),
  );
}

async function mutateAdminService(
  config: AdminApiConfig,
  path: string,
  method: "POST" | "PATCH",
  body: Record<string, unknown>,
): Promise<AdminServiceMutationResult> {
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
        : "ADMIN_SERVICE_SAVE_FAILED";

      return {
        ok: false,
        code,
        message: mapAdminServiceError(code),
      };
    }

    return {
      ok: true,
      service: requireService(payload),
    };
  } catch (error) {
    logAdminServicesError(error);

    return {
      ok: false,
      code: "ADMIN_SERVICE_SAVE_FAILED",
      message: "No pudimos guardar el servicio. Intenta nuevamente.",
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
    throw new AdminServicesLoadError(
      `Admin services API request failed with status ${response.status}.`,
      response.status,
    );
  }

  try {
    return await response.json() as T;
  } catch {
    throw new AdminServicesLoadError("Admin services API returned invalid JSON.");
  }
}

function toServicePayload(input: AdminServiceMutationInput) {
  return {
    name: input.name,
    description: input.description,
    basePriceClp: input.basePriceClp,
    durationMinutes: input.durationMinutes,
    bufferBeforeMinutes: input.bufferBeforeMinutes,
    bufferAfterMinutes: input.bufferAfterMinutes,
    status: input.status,
  };
}

function requireServices(payload: unknown): AdminService[] {
  if (!Array.isArray(payload)) {
    throw new AdminServicesLoadError("Admin services payload is not an array.");
  }

  return payload.map(requireService);
}

function requireService(payload: unknown): AdminService {
  if (!payload || typeof payload !== "object") {
    throw new AdminServicesLoadError("Admin service payload is not an object.");
  }

  const value = payload as Partial<AdminService>;

  const durationMinutes = value.durationMinutes;
  const priceFrom = value.priceFrom;

  if (!isNonEmptyString(value.id)
    || !isNonEmptyString(value.name)
    || typeof durationMinutes !== "number"
    || !Number.isInteger(durationMinutes)
    || typeof priceFrom !== "number"
    || !Number.isInteger(priceFrom)
    || !isNonEmptyString(value.currency)) {
    throw new AdminServicesLoadError("Admin service payload has invalid shape.");
  }

  const status = isAdminServiceStatus(value.status)
    ? value.status
    : value.isActive === true ? "ACTIVE" : "INACTIVE";

  return {
    id: value.id,
    slug: typeof value.slug === "string" ? value.slug : "",
    name: value.name,
    description: typeof value.description === "string" ? value.description : null,
    durationMinutes,
    priceFrom,
    priceTo: getIntegerOrDefault(value.priceTo, priceFrom),
    currency: value.currency,
    bufferBeforeMinutes: getIntegerOrDefault(value.bufferBeforeMinutes, 0),
    bufferAfterMinutes: getIntegerOrDefault(value.bufferAfterMinutes, 0),
    categoryId: typeof value.categoryId === "string" ? value.categoryId : null,
    categoryName: typeof value.categoryName === "string" ? value.categoryName : null,
    status,
    isActive: status === "ACTIVE",
    isMainService: typeof value.isMainService === "boolean" ? value.isMainService : true,
    sortOrder: getIntegerOrDefault(value.sortOrder, 0),
  };
}

function getIntegerOrDefault(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isInteger(value) ? value : fallback;
}

function mapAdminServiceError(code: string): string {
  const messages: Record<string, string> = {
    ADMIN_SERVICE_INVALID_INPUT: "Revisa los datos del servicio.",
    ADMIN_SERVICE_SLUG_DUPLICATED: "Ya existe un servicio con ese nombre o slug.",
    ADMIN_SERVICE_NOT_FOUND: "El servicio no existe en este negocio.",
    ADMIN_SERVICE_CATEGORY_NOT_FOUND: "La categoria del servicio no existe en este negocio.",
    TENANT_BUSINESS_MISMATCH: "No tienes acceso a este negocio.",
  };

  return messages[code] ?? "No pudimos guardar el servicio. Intenta nuevamente.";
}

function logAdminServicesError(error: unknown) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const message = error instanceof Error ? error.message : "Error desconocido.";
  const status = error instanceof AdminServicesLoadError && error.status
    ? ` status=${error.status}`
    : "";

  console.warn(`[admin/servicios] Fallo controlado:${status} ${message}`);
}

function isAdminServiceStatus(value: unknown): value is AdminServiceStatus {
  return value === "ACTIVE" || value === "INACTIVE" || value === "ARCHIVED";
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
