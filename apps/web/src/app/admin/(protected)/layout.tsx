import type { ReactNode } from "react";

import { AdminLayoutShell } from "@/components/admin/admin-layout-shell";
import { requireAdminSession, toAdminNavigation } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminProtectedLayout({ children }: { children: ReactNode }) {
  const session = await requireAdminSession("/admin");
  const firstMembership = session.memberships[0];
  const navigation = toAdminNavigation(session, {
    businessId: firstMembership.businessId,
    businessSlug: firstMembership.businessSlug,
    businessName: firstMembership.businessName,
    vertical: firstMembership.businessVertical === "BARBERSHOP" ? "barberia" : "belleza",
    role: firstMembership.role,
  });

  return <AdminLayoutShell navigation={navigation}>{children}</AdminLayoutShell>;
}
