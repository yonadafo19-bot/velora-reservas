import Link from "next/link";

import { AdminServicesPanel } from "@/components/admin/admin-services-panel";
import { Icon } from "@/components/ui/icon";
import { getAdminVertical } from "@/lib/admin-page";
import { getAdminServicesData } from "@/lib/admin-services-api";
import type { BusinessVertical } from "@/types/demo";

export const dynamic = "force-dynamic";

const nav: { href: string; label: string; icon: "chart" | "calendar" | "users" | "sparkles" | "clock" }[] = [
  { href: "/admin", label: "Resumen", icon: "chart" },
  { href: "/admin/citas", label: "Citas", icon: "calendar" },
  { href: "/admin/clientes", label: "Clientes", icon: "users" },
  { href: "/admin/servicios", label: "Servicios", icon: "sparkles" },
  { href: "/admin/profesionales", label: "Profesionales", icon: "users" },
  { href: "/admin/horarios", label: "Horarios", icon: "clock" },
  { href: "/admin/configuracion", label: "Configuracion", icon: "sparkles" },
];

const verticalLabel: Record<BusinessVertical, string> = {
  barberia: "Velora Barberia",
  belleza: "Velora Belleza",
};

export default async function Page({ searchParams }: { searchParams: Promise<{ negocio?: string }> }) {
  const vertical = await getAdminVertical(searchParams);
  const servicesState = await getAdminServicesData(vertical);

  return <div className={`admin-shell theme-${vertical}`}>
    <aside className="admin-sidebar">
      <div className="sidebar-aura"/>
      <Link href="/" className="admin-wordmark"><span>Velora</span><small>RESERVAS</small></Link>
      <div className="demo-admin-label"><i/> CONTROL ROOM - SERVICIOS REAL</div>
      <nav>{nav.map((item) => <Link className={item.href === "/admin/servicios" ? "active" : ""} href={`${item.href}?negocio=${vertical}`} key={item.href}><Icon name={item.icon}/><span>{item.label}</span></Link>)}</nav>
      <div className="sidebar-insight"><span>CATALOGO</span><strong>{servicesState.status === "REAL_CONNECTED" ? "Datos reales" : "Config pendiente"}</strong><small>{servicesState.status === "REAL_CONNECTED" ? "Conectado al API de Velora" : "Sin fallback demo"}</small><i><b style={{ width: servicesState.status === "REAL_CONNECTED" ? "100%" : "35%" }}/></i></div>
      <div className="sidebar-bottom"><span className="avatar">VD</span><span><strong>Administrador</strong><small>Sesion de desarrollo</small></span></div>
    </aside>
    <main className="admin-main">
      <header className="admin-topbar">
        <details className="mobile-admin-nav"><summary>Menu</summary><nav>{nav.map((item) => <Link href={`${item.href}?negocio=${vertical}`} key={item.href}>{item.label}</Link>)}</nav></details>
        <div className="vertical-switch"><span>Vista:</span><Link className={vertical === "barberia" ? "active" : ""} href="/admin/servicios?negocio=barberia">Barberia</Link><Link className={vertical === "belleza" ? "active" : ""} href="/admin/servicios?negocio=belleza">Belleza</Link></div>
        <span className="demo-pill">{servicesState.status}</span>
      </header>
      <div className="admin-content">
        <div className="admin-heading">
          <div>
            <span className="eyebrow">{verticalLabel[vertical].toUpperCase()}</span>
            <h1>Servicios</h1>
            <p>Gestiona el catalogo real que alimenta la agenda administrativa.</p>
          </div>
        </div>
        <AdminServicesPanel state={servicesState}/>
      </div>
    </main>
  </div>;
}
