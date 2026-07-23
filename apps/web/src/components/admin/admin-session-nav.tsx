import Link from "next/link";

import { logoutAdminAction } from "@/app/admin/actions";
import { Icon } from "@/components/ui/icon";
import { operationalDisplayName } from "@/lib/admin-display";

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
  compact = false,
  onNavigate,
}: {
  navigation: AdminNavigation;
  path: string;
  compact?: boolean;
  onNavigate?: () => void;
}) {
  return <div className={`admin-business-switcher${compact ? " is-compact" : ""}`} aria-label="Negocio activo">
    {!compact && <span>Negocio</span>}
    <div>
      {navigation.businesses.map((business) => <Link
        className={business.businessSlug === navigation.currentBusinessSlug ? "active" : ""}
        aria-current={business.businessSlug === navigation.currentBusinessSlug ? "page" : undefined}
        href={`${path}?negocio=${encodeURIComponent(business.businessSlug)}`}
        key={business.businessSlug}
        title={operationalBusinessName(business.businessName)}
        onClick={onNavigate}
      >
        <Icon name="building" size={17}/>
        <span>{operationalBusinessName(business.businessName)}</span>
      </Link>)}
    </div>
  </div>;
}

export function AdminSessionSummary({
  navigation,
  onNavigate,
}: {
  navigation: AdminNavigation;
  onNavigate?: () => void;
}) {
  const initials = accountInitials(navigation.email);

  return <details className="admin-profile-menu">
    <summary className="admin-profile-trigger" aria-label="Abrir menú de perfil">
      <span className="avatar" aria-hidden="true">{initials}</span>
      <span className="admin-profile-copy">
        <strong>Administrador</strong>
        <small title={navigation.email}>{navigation.email}</small>
      </span>
      <Icon name="chevron" size={18}/>
    </summary>
    <div className="admin-profile-popover">
      <div className="admin-profile-identity">
        <span className="avatar" aria-hidden="true">{initials}</span>
        <span><strong>Administrador</strong><small title={navigation.email}>{navigation.email}</small></span>
      </div>
      <Link href={`/admin/configuracion?negocio=${encodeURIComponent(navigation.currentBusinessSlug)}`} onClick={onNavigate}>
        <Icon name="user" size={19}/><span>Mi cuenta</span>
      </Link>
      <form action={logoutAdminAction}>
        <button type="submit"><Icon name="logout" size={19}/><span>Cerrar sesión</span></button>
      </form>
    </div>
  </details>;
}

export function operationalBusinessName(name: string) {
  return operationalDisplayName(name);
}

function accountInitials(email: string) {
  const localPart = email.split("@")[0] ?? "admin";
  const parts = localPart.split(/[._-]+/).filter(Boolean);
  const value = parts.length > 1
    ? `${parts[0][0] ?? "A"}${parts[1][0] ?? "D"}`
    : localPart.slice(0, 2);

  return value.toUpperCase();
}
