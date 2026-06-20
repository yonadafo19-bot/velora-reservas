"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";

export function Wordmark({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link className={`wordmark${inverse ? " wordmark--inverse" : ""}`} href="/" aria-label="Velora Reservas, inicio">
      <span>Velora</span><small>RESERVAS</small>
    </Link>
  );
}

export function SiteHeader({ inverse = false }: { inverse?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <header className={`site-header${inverse ? " site-header--inverse" : ""}`}>
      <div className="container site-header__inner">
        <Wordmark inverse={inverse} />
        <nav className={`site-nav${open ? " is-open" : ""}`} aria-label="Navegación principal">
          <Link href="/barberia" onClick={() => setOpen(false)}>Barbería</Link>
          <Link href="/belleza" onClick={() => setOpen(false)}>Belleza</Link>
          <Link href="/precios" onClick={() => setOpen(false)}>Precios</Link>
          <Link href="/contacto" onClick={() => setOpen(false)}>Contacto</Link>
          <Link className="button button--small" href="/reservar" onClick={() => setOpen(false)}>Ver demo</Link>
        </nav>
        <button className="nav-toggle" type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? "Cerrar menú" : "Abrir menú"}>
          <Icon name={open ? "close" : "menu"} />
        </button>
      </div>
    </header>
  );
}

