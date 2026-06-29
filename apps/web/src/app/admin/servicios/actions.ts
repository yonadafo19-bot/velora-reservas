"use server";

import { revalidatePath } from "next/cache";

import {
  createAdminService,
  updateAdminService,
  type AdminServiceMutationInput,
  type AdminServiceMutationResult,
  type AdminServiceStatus,
} from "@/lib/admin-services-api";

const ALLOWED_STATUSES = new Set(["ACTIVE", "INACTIVE", "ARCHIVED"]);

export async function createAdminServiceAction(
  input: AdminServiceMutationInput,
): Promise<AdminServiceMutationResult> {
  const validation = validateServiceInput(input);
  if (!validation.ok) {
    return validation;
  }

  const result = await createAdminService(validation.input);
  revalidateAfterServiceMutation(result);

  return result;
}

export async function updateAdminServiceAction(
  input: AdminServiceMutationInput & { serviceId?: string },
): Promise<AdminServiceMutationResult> {
  if (!isNonEmptyString(input.serviceId)) {
    return {
      ok: false,
      code: "ADMIN_SERVICE_INVALID_INPUT",
      message: "Selecciona un servicio valido para editar.",
    };
  }

  const validation = validateServiceInput(input);
  if (!validation.ok) {
    return validation;
  }

  const result = await updateAdminService({
    ...validation.input,
    serviceId: input.serviceId.trim(),
  });
  revalidateAfterServiceMutation(result);

  return result;
}

function revalidateAfterServiceMutation(result: AdminServiceMutationResult) {
  if (!result.ok) {
    return;
  }

  revalidatePath("/admin/servicios");
  revalidatePath("/admin/citas");
}

function validateServiceInput(input: AdminServiceMutationInput):
  | { ok: true; input: AdminServiceMutationInput }
  | { ok: false; code: string; message: string } {
  if (!input || typeof input !== "object"
    || !isNonEmptyString(input.businessSlug)
    || !isNonEmptyString(input.name)) {
    return invalidInput("Completa el nombre del servicio.");
  }

  if (!Number.isInteger(input.basePriceClp) || input.basePriceClp < 0) {
    return invalidInput("El precio debe ser un monto CLP valido.");
  }

  if (!Number.isInteger(input.durationMinutes) || input.durationMinutes <= 0) {
    return invalidInput("La duracion debe ser mayor a cero.");
  }

  if (!Number.isInteger(input.bufferBeforeMinutes) || input.bufferBeforeMinutes < 0
    || !Number.isInteger(input.bufferAfterMinutes) || input.bufferAfterMinutes < 0) {
    return invalidInput("Los buffers deben ser minutos validos.");
  }

  if (!isAdminServiceStatus(input.status)) {
    return invalidInput("Selecciona un estado valido.");
  }

  return {
    ok: true,
    input: {
      businessSlug: input.businessSlug.trim(),
      name: input.name.trim(),
      description: normalizeOptionalString(input.description),
      basePriceClp: input.basePriceClp,
      durationMinutes: input.durationMinutes,
      bufferBeforeMinutes: input.bufferBeforeMinutes,
      bufferAfterMinutes: input.bufferAfterMinutes,
      status: input.status,
    },
  };
}

function invalidInput(message: string) {
  return {
    ok: false as const,
    code: "ADMIN_SERVICE_INVALID_INPUT",
    message,
  };
}

function normalizeOptionalString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function isAdminServiceStatus(value: unknown): value is AdminServiceStatus {
  return typeof value === "string" && ALLOWED_STATUSES.has(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
