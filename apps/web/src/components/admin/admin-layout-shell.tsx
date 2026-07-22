"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

import {
  AdminBusinessSwitcher,
  AdminSessionSummary,
  type AdminNavigation,
} from "@/components/admin/admin-session-nav";
import { Icon } from "@/components/ui/icon";

const nav = [
  { href: "/admin", label: "Resumen", icon: "chart" },
  { href: "/admin/citas", label: "Citas", icon: "calendar" },
  { href: "/admin/clientes", label: "Clientes", icon: "users" },
  { href: "/admin/servicios", label: "Servicios", icon: "sparkles" },
  { href: "/admin/profesionales", label: "Profesionales", icon: "users" },
  { href: "/admin/horarios", label: "Horarios", icon: "clock" },
  { href: "/admin/configuracion", label: "Configuración", icon: "sparkles" },
] as const;

const realRouteLabels: Record<string, string> = {
  "/admin/citas": "AGENDA REAL",
  "/admin/servicios": "SERVICIOS REAL",
  "/admin/profesionales": "PROFESIONALES REAL",
  "/admin/horarios": "HORARIOS REAL",
};

export function AdminLayoutShell({
  children,
  navigation,
}: {
  children: ReactNode;
  navigation: AdminNavigation;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedSlug = searchParams.get("negocio");
  const exactBusiness = navigation.businesses.find(
    (business) => business.businessSlug === requestedSlug,
  );
  const currentBusiness = exactBusiness ?? navigation.businesses[0];
  const currentNavigation = {
    ...navigation,
    currentBusinessSlug: currentBusiness.businessSlug,
  };
  const theme = currentBusiness.businessVertical === "BEAUTY_STUDIO" ? "belleza" : "barberia";
  const realLabel = realRouteLabels[pathname];
  const isRealRoute = Boolean(realLabel);

  return <div className={`admin-shell theme-${theme}`}>
    <aside className="admin-sidebar">
      <div className="sidebar-aura"/>
      <Link href="/" className="admin-wordmark"><span>Velora</span><small>RESERVAS</small></Link>
      <div className="demo-admin-label"><i/> CONTROL ROOM · {realLabel ?? "DEMO"}</div>
      <nav>{nav.map((item) => <Link
        className={pathname === item.href ? "active" : ""}
        aria-current={pathname === item.href ? "page" : undefined}
        href={`${item.href}?negocio=${encodeURIComponent(currentBusiness.businessSlug)}`}
        key={item.href}
      ><Icon name={item.icon}/><span>{item.label}</span></Link>)}</nav>
      <div className="sidebar-insight">
        <span>{isRealRoute ? "OPERACIÓN" : "VISTA"}</span>
        <strong>{isRealRoute ? "Datos reales" : "Datos demo"}</strong>
        <small>{isRealRoute ? "Conectada al API de Velora" : "Entorno de demostración"}</small>
        <i><b style={{ width: isRealRoute ? "100%" : "70%" }}/></i>
      </div>
      <AdminSessionSummary navigation={currentNavigation}/>
    </aside>
    <main className="admin-main">
      <header className="admin-topbar">
        <details className="mobile-admin-nav">
          <summary>Menú</summary>
          <nav>{nav.map((item) => <Link
            href={`${item.href}?negocio=${encodeURIComponent(currentBusiness.businessSlug)}`}
            key={item.href}
          >{item.label}</Link>)}<AdminSessionSummary navigation={currentNavigation}/></nav>
        </details>
        <AdminBusinessSwitcher navigation={currentNavigation} path={pathname}/>
        <span className="demo-pill">{realLabel ?? "DATOS DEMO"}</span>
      </header>
      {children}
    </main>
  </div>;
}
