import { AdminPage } from "@/components/admin/admin-page";
import { getAdminAppointmentFormData } from "@/lib/admin-appointments-api";
import { getAdminCalendar } from "@/lib/admin-calendar-api";
import { getAdminVertical } from "@/lib/admin-page";
import type { AdminAppointmentFormLoadState } from "@/types/admin-appointment-form";
import type { AdminCalendarLoadState } from "@/types/admin-calendar";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ negocio?: string }> }) {
  const vertical = await getAdminVertical(searchParams);
  const [calendar, appointmentForm] = await Promise.all([
    loadCalendarSafely(vertical),
    loadAppointmentFormSafely(vertical),
  ]);

  return <AdminPage view="citas" vertical={vertical} path="/admin/citas" calendar={calendar} appointmentForm={appointmentForm}/>;
}

async function loadCalendarSafely(
  vertical: Awaited<ReturnType<typeof getAdminVertical>>,
): Promise<AdminCalendarLoadState> {
  try {
    return await getAdminCalendar(vertical);
  } catch (error) {
    logAdminCitasLoadError("calendar", error);

    return {
      status: "error",
      debugBlock: "calendar",
      message: "No pudimos cargar la agenda. Intenta nuevamente.",
    };
  }
}

async function loadAppointmentFormSafely(
  vertical: Awaited<ReturnType<typeof getAdminVertical>>,
): Promise<AdminAppointmentFormLoadState> {
  try {
    return await getAdminAppointmentFormData(vertical);
  } catch (error) {
    logAdminCitasLoadError("appointment-form", error);

    return {
      status: "error",
      message: "No pudimos cargar los datos para crear una cita. Intenta nuevamente.",
    };
  }
}

function logAdminCitasLoadError(block: string, error: unknown) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const message = error instanceof Error ? error.message : "Error desconocido.";
  console.error(`[admin/citas] Fallo controlado en ${block}: ${message}`);
}
