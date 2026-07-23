"use server";

import { revalidatePath } from "next/cache";

import {
  createAdminAppointment,
  getAdminAppointmentFormData,
  getAdminAppointmentProfessionalAvailability,
} from "@/lib/admin-appointments-api";
import { requireAdminBusiness } from "@/lib/admin-auth";
import type {
  AdminAppointmentAvailabilityLoadState,
  AdminAppointmentFormLoadState,
  AdminCreateAppointmentInput,
  AdminCreateAppointmentResult,
} from "@/types/admin-appointment-form";

export async function loadAdminAppointmentFormAction(
  businessSlug: string,
): Promise<AdminAppointmentFormLoadState> {
  await requireAdminBusiness(businessSlug);
  return getAdminAppointmentFormData(businessSlug);
}

export async function loadAdminAppointmentAvailabilityAction(input: {
  businessSlug: string;
  professionalId: string;
}): Promise<AdminAppointmentAvailabilityLoadState> {
  await requireAdminBusiness(input.businessSlug);
  return getAdminAppointmentProfessionalAvailability(input.businessSlug, input.professionalId);
}

export async function createAdminAppointmentAction(
  input: AdminCreateAppointmentInput,
): Promise<AdminCreateAppointmentResult> {
  await requireAdminBusiness(input.businessSlug);
  const result = await createAdminAppointment(input);

  if (result.ok) {
    revalidatePath("/admin/citas");
  }

  return result;
}
