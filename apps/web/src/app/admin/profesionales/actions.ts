"use server";

import { revalidatePath } from "next/cache";

import {
  createAdminProfessional,
  updateAdminProfessional,
  updateAdminProfessionalLocations,
  updateAdminProfessionalServices,
  type AdminProfessionalLocationsInput,
  type AdminProfessionalMutationInput,
  type AdminProfessionalMutationResult,
  type AdminProfessionalServicesInput,
  type AdminProfessionalStatus,
} from "@/lib/admin-professionals-api";

const ALLOWED_STATUSES = new Set(["ACTIVE", "INACTIVE", "ARCHIVED"]);

export async function createAdminProfessionalAction(
  input: AdminProfessionalMutationInput,
): Promise<AdminProfessionalMutationResult> {
  const validation = validateProfessionalInput(input);
  if (!validation.ok) {
    return validation;
  }

  const result = await createAdminProfessional(validation.input);
  revalidateAfterProfessionalMutation(result);

  return result;
}

export async function updateAdminProfessionalAction(
  input: AdminProfessionalMutationInput & { professionalId?: string },
): Promise<AdminProfessionalMutationResult> {
  if (!isNonEmptyString(input.professionalId)) {
    return invalidInput("Selecciona un profesional valido para editar.");
  }

  const validation = validateProfessionalInput(input);
  if (!validation.ok) {
    return validation;
  }

  const result = await updateAdminProfessional({
    ...validation.input,
    professionalId: input.professionalId.trim(),
  });
  revalidateAfterProfessionalMutation(result);

  return result;
}

export async function updateAdminProfessionalServicesAction(
  input: AdminProfessionalServicesInput,
): Promise<AdminProfessionalMutationResult> {
  const validation = validateProfessionalServicesInput(input);
  if (!validation.ok) {
    return validation;
  }

  const result = await updateAdminProfessionalServices(validation.input);
  revalidateAfterProfessionalMutation(result);

  return result;
}

export async function updateAdminProfessionalLocationsAction(
  input: AdminProfessionalLocationsInput,
): Promise<AdminProfessionalMutationResult> {
  const validation = validateProfessionalLocationsInput(input);
  if (!validation.ok) {
    return validation;
  }

  const result = await updateAdminProfessionalLocations(validation.input);
  revalidateAfterProfessionalMutation(result);

  return result;
}

function revalidateAfterProfessionalMutation(result: AdminProfessionalMutationResult) {
  if (!result.ok) {
    return;
  }

  revalidatePath("/admin/profesionales");
  revalidatePath("/admin/horarios");
  revalidatePath("/admin/citas");
}

function validateProfessionalInput(input: AdminProfessionalMutationInput):
  | { ok: true; input: AdminProfessionalMutationInput }
  | { ok: false; code: string; message: string } {
  if (!input || typeof input !== "object"
    || !isNonEmptyString(input.businessSlug)
    || !isNonEmptyString(input.displayName)) {
    return invalidInput("Completa el nombre del profesional.");
  }

  if (!isAdminProfessionalStatus(input.status)) {
    return invalidInput("Selecciona un estado valido.");
  }

  return {
    ok: true,
    input: {
      businessSlug: input.businessSlug.trim(),
      displayName: input.displayName.trim(),
      roleTitle: normalizeOptionalString(input.roleTitle),
      bio: normalizeOptionalString(input.bio),
      ...(input.phone !== undefined ? { phone: normalizeOptionalString(input.phone) } : {}),
      ...(input.email !== undefined ? { email: normalizeOptionalString(input.email) } : {}),
      status: input.status,
    },
  };
}

function validateProfessionalServicesInput(input: AdminProfessionalServicesInput):
  | { ok: true; input: AdminProfessionalServicesInput }
  | { ok: false; code: string; message: string } {
  if (!input || typeof input !== "object"
    || !isNonEmptyString(input.businessSlug)
    || !isNonEmptyString(input.professionalId)
    || !Array.isArray(input.serviceIds)) {
    return invalidInput("Revisa los servicios asignados.");
  }

  const serviceIds = input.serviceIds
    .filter(isNonEmptyString)
    .map((serviceId) => serviceId.trim());

  if (serviceIds.length !== input.serviceIds.length) {
    return invalidInput("Revisa los servicios asignados.");
  }

  if (new Set(serviceIds).size !== serviceIds.length) {
    return {
      ok: false,
      code: "ADMIN_PROFESSIONAL_SERVICES_DUPLICATED",
      message: "No repitas servicios para el mismo profesional.",
    };
  }

  return {
    ok: true,
    input: {
      businessSlug: input.businessSlug.trim(),
      professionalId: input.professionalId.trim(),
      serviceIds,
    },
  };
}

function validateProfessionalLocationsInput(input: AdminProfessionalLocationsInput):
  | { ok: true; input: AdminProfessionalLocationsInput }
  | { ok: false; code: string; message: string } {
  if (!input || typeof input !== "object"
    || !isNonEmptyString(input.businessSlug)
    || !isNonEmptyString(input.professionalId)
    || !Array.isArray(input.locationIds)) {
    return invalidInput("Revisa las sucursales asignadas.");
  }

  const locationIds = input.locationIds
    .filter(isNonEmptyString)
    .map((locationId) => locationId.trim());

  if (locationIds.length !== input.locationIds.length) {
    return invalidInput("Revisa las sucursales asignadas.");
  }

  if (new Set(locationIds).size !== locationIds.length) {
    return {
      ok: false,
      code: "ADMIN_PROFESSIONAL_LOCATIONS_DUPLICATED",
      message: "No repitas sucursales para el mismo profesional.",
    };
  }

  return {
    ok: true,
    input: {
      businessSlug: input.businessSlug.trim(),
      professionalId: input.professionalId.trim(),
      locationIds,
    },
  };
}

function invalidInput(message: string) {
  return {
    ok: false as const,
    code: "ADMIN_PROFESSIONAL_INVALID_INPUT",
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

function isAdminProfessionalStatus(value: unknown): value is AdminProfessionalStatus {
  return typeof value === "string" && ALLOWED_STATUSES.has(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
