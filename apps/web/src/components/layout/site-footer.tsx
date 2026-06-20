import Link from "next/link";
import { Wordmark } from "./site-header";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div><Wordmark inverse /><p>Reservas online premium para negocios que cuidan cada detalle.</p></div>
        <div><strong>Experiencias</strong><Link href="/barberia">Velora Barbería</Link><Link href="/belleza">Velora Belleza</Link></div>
        <div><strong>Velora</strong><Link href="/precios">Precios</Link><Link href="/contacto">Contacto</Link><Link href="/admin">Panel demo</Link></div>
      </div>
      <div className="container footer-bottom"><span>© 2026 Velora Reservas</span><span>Demo comercial · Chile</span></div>
    </footer>
  );
}

