"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

import {
  AdminBusinessSwitcher,
  AdminSessionSummary,
  operationalBusinessName,
  type AdminNavigation,
} from "@/components/admin/admin-session-nav";
import { Icon } from "@/components/ui/icon";

const nav = [
  { href: "/admin", label: "Resumen", icon: "chart" },
  { href: "/admin/citas", label: "Agenda", icon: "calendar" },
  { href: "/admin/clientes", label: "Clientes", icon: "users" },
  { href: "/admin/servicios", label: "Servicios", icon: "sparkles" },
  { href: "/admin/profesionales", label: "Equipo", icon: "user" },
  { href: "/admin/horarios", label: "Horarios", icon: "clock" },
  { href: "/admin/configuracion", label: "Configuración", icon: "settings" },
] as const;

const routeContext: Record<string, { eyebrow: string; title: string }> = {
  "/admin": { eyebrow: "Panel", title: "Resumen" },
  "/admin/citas": { eyebrow: "Operación", title: "Agenda" },
  "/admin/clientes": { eyebrow: "Relaciones", title: "Clientes" },
  "/admin/servicios": { eyebrow: "Catálogo", title: "Servicios" },
  "/admin/profesionales": { eyebrow: "Gestión", title: "Equipo" },
  "/admin/horarios": { eyebrow: "Planificación", title: "Horarios" },
  "/admin/configuracion": { eyebrow: "Preferencias", title: "Configuración" },
};

const drawerFocusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "details > summary",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function AdminLayoutShell({
  children,
  navigation,
}: {
  children: ReactNode;
  navigation: AdminNavigation;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const desktopSidebarRef = useRef<HTMLElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileDrawerRef = useRef<HTMLElement>(null);
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
  const context = routeContext[pathname] ?? routeContext["/admin"];
  const businessName = operationalBusinessName(currentBusiness.businessName);

  useEffect(() => {
    if (!isMobileNavOpen) {
      return;
    }

    const drawer = mobileDrawerRef.current;
    const desktopSidebar = desktopSidebarRef.current;
    const main = mainRef.current;
    const mobileMenuButton = mobileMenuButtonRef.current;
    const previousSidebarInert = desktopSidebar?.inert ?? false;
    const previousMainInert = main?.inert ?? false;

    const getFocusableElements = () => Array.from(
      drawer?.querySelectorAll<HTMLElement>(drawerFocusableSelector) ?? [],
    ).filter((element) => element.getClientRects().length > 0);

    const handleDrawerKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsMobileNavOpen(false);
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = getFocusableElements();
      const firstElement = focusableElements[0];
      const lastElement = focusableElements.at(-1);

      if (!firstElement || !lastElement) {
        event.preventDefault();
        drawer?.focus();
        return;
      }

      const activeElement = document.activeElement;
      if (!drawer?.contains(activeElement)) {
        event.preventDefault();
        (event.shiftKey ? lastElement : firstElement).focus();
      } else if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (desktopSidebar) {
      desktopSidebar.inert = true;
    }
    if (main) {
      main.inert = true;
    }
    window.addEventListener("keydown", handleDrawerKeyDown);
    const focusFrame = window.requestAnimationFrame(() => {
      getFocusableElements()[0]?.focus();
    });

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      if (desktopSidebar) {
        desktopSidebar.inert = previousSidebarInert;
      }
      if (main) {
        main.inert = previousMainInert;
      }
      window.removeEventListener("keydown", handleDrawerKeyDown);
      mobileMenuButton?.focus();
    };
  }, [isMobileNavOpen]);

  return <div className={`admin-shell theme-${theme}`}>
    <aside className="admin-sidebar" ref={desktopSidebarRef}>
      <div className="admin-sidebar-brand">
        <Link href="/admin" className="admin-wordmark"><span>Velora</span><small>RESERVAS</small></Link>
        <p title={businessName}>{businessName}</p>
      </div>
      <AdminNavigationLinks
        businessSlug={currentBusiness.businessSlug}
        pathname={pathname}
      />
      <AdminSessionSummary navigation={currentNavigation}/>
    </aside>

    <main className="admin-main" ref={mainRef}>
      <header className="admin-topbar">
        <button
          className="admin-mobile-menu-button"
          ref={mobileMenuButtonRef}
          type="button"
          aria-label="Abrir navegación"
          aria-controls="admin-mobile-drawer"
          aria-expanded={isMobileNavOpen}
          onClick={() => setIsMobileNavOpen(true)}
        ><Icon name="menu" size={22}/></button>
        <div className="admin-topbar-context">
          <span>{context.eyebrow}</span>
          <strong>{context.title}</strong>
        </div>
        <div className="admin-topbar-meta">
          <span className="admin-business-mobile" title={businessName}>{businessName}</span>
          <time suppressHydrationWarning>{operationalDate()}</time>
          <AdminBusinessSwitcher navigation={currentNavigation} path={pathname} compact/>
        </div>
      </header>
      {children}
    </main>

    {isMobileNavOpen && <div className="admin-mobile-layer">
      <button className="admin-mobile-backdrop" type="button" aria-label="Cerrar navegación" onClick={() => setIsMobileNavOpen(false)}/>
      <aside
        className="admin-mobile-drawer"
        id="admin-mobile-drawer"
        ref={mobileDrawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navegación administrativa"
        tabIndex={-1}
      >
        <header>
          <div className="admin-wordmark"><span>Velora</span><small>RESERVAS</small></div>
          <button className="admin-icon-button" type="button" aria-label="Cerrar navegación" onClick={() => setIsMobileNavOpen(false)}><Icon name="close" size={22}/></button>
        </header>
        <div className="admin-mobile-business"><small>Negocio actual</small><strong title={businessName}>{businessName}</strong></div>
        <AdminNavigationLinks
          businessSlug={currentBusiness.businessSlug}
          pathname={pathname}
          onNavigate={() => setIsMobileNavOpen(false)}
        />
        <AdminBusinessSwitcher navigation={currentNavigation} path={pathname} onNavigate={() => setIsMobileNavOpen(false)}/>
        <AdminSessionSummary navigation={currentNavigation} onNavigate={() => setIsMobileNavOpen(false)}/>
      </aside>
    </div>}
  </div>;
}

function AdminNavigationLinks({
  businessSlug,
  pathname,
  onNavigate,
}: {
  businessSlug: string;
  pathname: string;
  onNavigate?: () => void;
}) {
  return <nav className="admin-primary-nav" aria-label="Navegación principal">
    {nav.map((item) => <Link
      className={pathname === item.href ? "active" : ""}
      aria-current={pathname === item.href ? "page" : undefined}
      href={`${item.href}?negocio=${encodeURIComponent(businessSlug)}`}
      key={item.href}
      onClick={onNavigate}
    ><Icon name={item.icon}/><span>{item.label}</span></Link>)}
  </nav>;
}

function operationalDate() {
  return new Intl.DateTimeFormat("es-CL", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "America/Santiago",
  }).format(new Date()).replace(/^./, (letter) => letter.toUpperCase());
}
