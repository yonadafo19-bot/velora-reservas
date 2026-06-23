"use server";

import { revalidatePath } from "next/cache";

import { createAdminAppointment } from "@/lib/admin-appointments-api";
import type { AdminCreateAppointmentInput, AdminCreateAppointmentResult } from "@/types/admin-appointment-form";

export async function createAdminAppointmentAction(
  input: AdminCreateAppointmentInput,
): Promise<AdminCreateAppointmentResult> {
  const result = await createAdminAppointment(input);

  if (result.ok) {
    revalidatePath("/admin/citas");
  }

  return result;
}
