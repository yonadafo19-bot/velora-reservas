import Link from "next/link";

import { logoutAdminAction } from "@/app/admin/actions";

export interface AdminNavigation {
  email: string;
  currentBusinessSlug: string;
  businesses: Array<{
    businessSlug: string;
    businessName: string;
    businessVertical: "BARBERSHOP" | "BEAUTY_STUDIO";
  }>;
}

export function AdminBusinessSwitcher({
  navigation,
  path,
}: {
  navigation: AdminNavigation;
  path: string;
}) {
  return <div className="vertical-switch" aria-label="Negocio activo">
    <span>Negocio:</span>
    {navigation.businesses.map((business) => <Link
      className={business.businessSlug === navigation.currentBusinessSlug ? "active" : ""}
      aria-current={business.businessSlug === navigation.currentBusinessSlug ? "page" : undefined}
      href={`${path}?negocio=${encodeURIComponent(business.businessSlug)}`}
      key={business.businessSlug}
    >
      {business.businessName}
    </Link>)}
  </div>;
}

export function AdminSessionSummary({ navigation }: { navigation: AdminNavigation }) {
  const initials = navigation.email.slice(0, 2).toUpperCase();
  return <div className="sidebar-bottom admin-session-summary">
    <span className="avatar">{initials}</span>
    <span><strong>Administrador</strong><small>{navigation.email}</small></span>
    <form action={logoutAdminAction}>
      <button type="submit">Salir</button>
    </form>
  </div>;
}
