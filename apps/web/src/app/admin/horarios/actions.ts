"use server";

import { revalidatePath } from "next/cache";

import {
  updateBusinessHours,
  updateProfessionalAvailability,
  type AdminAvailabilityMutationResult,
  type AdminAvailabilityStatus,
  type AdminAvailabilityWeekday,
  type AdminBusinessHourInput,
  type AdminBusinessHoursMutationInput,
  type AdminProfessionalAvailabilityMutationInput,
  type AdminProfessionalAvailabilityRuleInput,
} from "@/lib/admin-availability-api";
import { requireAdminBusiness } from "@/lib/admin-auth";

const ALLOWED_WEEKDAYS = new Set(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]);
const ALLOWED_STATUSES = new Set(["ACTIVE", "INACTIVE"]);
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function updateBusinessHoursAction(
  input: AdminBusinessHoursMutationInput,
): Promise<AdminAvailabilityMutationResult> {
  await requireAdminBusiness(input.businessSlug);
  const validation = validateBusinessHoursInput(input);
  if (!validation.ok) {
    return validation;
  }

  const result = await updateBusinessHours(validation.input);
  revalidateAfterAvailabilityMutation(result);

  return result;
}

export async function updateProfessionalAvailabilityAction(
  input: AdminProfessionalAvailabilityMutationInput,
): Promise<AdminAvailabilityMutationResult> {
  await requireAdminBusiness(input.businessSlug);
  const validation = validateProfessionalAvailabilityInput(input);
  if (!validation.ok) {
    return validation;
  }

  const result = await updateProfessionalAvailability(validation.input);
  revalidateAfterAvailabilityMutation(result);

  return result;
}

function revalidateAfterAvailabilityMutation(result: AdminAvailabilityMutationResult) {
  if (!result.ok) {
    return;
  }

  revalidatePath("/admin/horarios");
  revalidatePath("/admin/citas");
}

function validateBusinessHoursInput(input: AdminBusinessHoursMutationInput):
  | { ok: true; input: AdminBusinessHoursMutationInput }
  | { ok: false; code: string; message: string } {
  if (!input || typeof input !== "object"
    || !isNonEmptyString(input.businessSlug)
    || !Array.isArray(input.hours)) {
    return invalidInput("Revisa los horarios del negocio.");
  }

  const hours = input.hours.map(validateBusinessHour);
  const invalid = hours.find((entry) => !entry.ok);
  if (invalid && !invalid.ok) {
    return invalid;
  }

  return {
    ok: true,
    input: {
      businessSlug: input.businessSlug.trim(),
      hours: hours.map((entry) => entry.ok ? entry.value : unreachable()),
    },
  };
}

function validateProfessionalAvailabilityInput(input: AdminProfessionalAvailabilityMutationInput):
  | { ok: true; input: AdminProfessionalAvailabilityMutationInput }
  | { ok: false; code: string; message: string } {
  if (!input || typeof input !== "object"
    || !isNonEmptyString(input.businessSlug)
    || !isNonEmptyString(input.professionalId)
    || !Array.isArray(input.rules)) {
    return invalidInput("Revisa la disponibilidad del profesional.");
  }

  const rules = input.rules.map(validateProfessionalRule);
  const invalid = rules.find((entry) => !entry.ok);
  if (invalid && !invalid.ok) {
    return invalid;
  }

  return {
    ok: true,
    input: {
      businessSlug: input.businessSlug.trim(),
      professionalId: input.professionalId.trim(),
      rules: rules.map((entry) => entry.ok ? entry.value : unreachable()),
    },
  };
}

function validateBusinessHour(input: AdminBusinessHourInput):
  | { ok: true; value: AdminBusinessHourInput }
  | { ok: false; code: string; message: string } {
  if (!isWeekday(input.weekday)
    || !isTimeString(input.opensAtLocal)
    || !isTimeString(input.closesAtLocal)
    || !isAvailabilityStatus(input.status)
    || !isStartBeforeEnd(input.opensAtLocal, input.closesAtLocal)) {
    return invalidInput("Revisa los dias y horarios del negocio.");
  }

  return {
    ok: true,
    value: {
      locationId: typeof input.locationId === "string" && input.locationId.trim() ? input.locationId.trim() : null,
      weekday: input.weekday,
      opensAtLocal: input.opensAtLocal,
      closesAtLocal: input.closesAtLocal,
      status: input.status,
    },
  };
}

function validateProfessionalRule(input: AdminProfessionalAvailabilityRuleInput):
  | { ok: true; value: AdminProfessionalAvailabilityRuleInput }
  | { ok: false; code: string; message: string } {
  if (!isNonEmptyString(input.locationId)
    || !isWeekday(input.weekday)
    || !isTimeString(input.startsAtLocal)
    || !isTimeString(input.endsAtLocal)
    || !isAvailabilityStatus(input.status)
    || !isStartBeforeEnd(input.startsAtLocal, input.endsAtLocal)) {
    return invalidInput("Revisa los dias, sucursal y horarios del profesional.");
  }

  return {
    ok: true,
    value: {
      locationId: input.locationId.trim(),
      weekday: input.weekday,
      startsAtLocal: input.startsAtLocal,
      endsAtLocal: input.endsAtLocal,
      status: input.status,
    },
  };
}

function invalidInput(message: string) {
  return {
    ok: false as const,
    code: "ADMIN_AVAILABILITY_INVALID_INPUT",
    message,
  };
}

function isWeekday(value: unknown): value is AdminAvailabilityWeekday {
  return typeof value === "string" && ALLOWED_WEEKDAYS.has(value);
}

function isAvailabilityStatus(value: unknown): value is AdminAvailabilityStatus {
  return typeof value === "string" && ALLOWED_STATUSES.has(value);
}

function isTimeString(value: unknown): value is string {
  return typeof value === "string" && TIME_PATTERN.test(value);
}

function isStartBeforeEnd(start: string, end: string) {
  return toMinutes(start) < toMinutes(end);
}

function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return (hours * 60) + minutes;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function unreachable(): never {
  throw new Error("Unreachable validation branch.");
}
