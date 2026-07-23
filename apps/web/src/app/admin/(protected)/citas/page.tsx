import { AdminPage } from "@/components/admin/admin-page";
import { getAdminCalendar } from "@/lib/admin-calendar-api";
import { getAdminPageContext } from "@/lib/admin-page";
import type { AdminCalendarLoadState } from "@/types/admin-calendar";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ negocio?: string }> }) {
  const context = await getAdminPageContext(searchParams, "/admin/citas");
  const calendar = await loadCalendarSafely(context.business.businessSlug);

  return <AdminPage view="citas" vertical={context.business.vertical} path="/admin/citas" navigation={context.navigation} calendar={calendar}/>;
}

async function loadCalendarSafely(
  businessSlug: string,
): Promise<AdminCalendarLoadState> {
  try {
    return await getAdminCalendar(businessSlug);
  } catch (error) {
    logAdminCitasLoadError("calendar", error);

    return {
      status: "error",
      debugBlock: "calendar",
      message: "No pudimos cargar la agenda. Intenta nuevamente.",
    };
  }
}

function logAdminCitasLoadError(block: string, error: unknown) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const message = error instanceof Error ? error.message : "Error desconocido.";
  console.warn(`[admin/citas] Fallo controlado en ${block}: ${message}`);
}
