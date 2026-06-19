import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Icon } from "@/components/ui/icon";

const plans = [
  { name: "Esencial", price: "$29.990", text: "Para comenzar a recibir reservas online.", items: ["Sitio de reservas personalizado", "Servicios y profesionales", "Agenda digital", "Soporte por correo"] },
  { name: "Premium", price: "$49.990", text: "La experiencia completa para elevar tu negocio.", featured: true, items: ["Todo lo de Esencial", "Panel de clientes y métricas", "Personalización visual premium", "Soporte prioritario"] },
  { name: "A medida", price: "Conversemos", text: "Para equipos con necesidades especiales.", items: ["Configuración personalizada", "Múltiples ubicaciones", "Acompañamiento dedicado", "Integraciones futuras"] },
];

export default function PreciosPage() {
  return <main><SiteHeader/><section className="page-hero"><div className="container"><span className="eyebrow">PLANES REFERENCIALES</span><h1>Una inversión pequeña.<br/><em>Una imagen mucho más grande.</em></h1><p>Precios demostrativos para visualizar la propuesta. No constituyen una oferta comercial definitiva.</p></div></section><section className="section section--tight"><div className="container pricing-grid">{plans.map((plan) => <article className={`price-card${plan.featured ? " is-featured" : ""}`} key={plan.name}>{plan.featured && <span className="popular-label">MÁS ELEGIDO</span>}<h2>{plan.name}</h2><p>{plan.text}</p><div className="price"><strong>{plan.price}</strong>{plan.price.startsWith("$") && <span>/ mes</span>}</div><ul>{plan.items.map((item) => <li key={item}><Icon name="check" size={17}/>{item}</li>)}</ul><Link className={`button${plan.featured ? "" : " button--ghost"}`} href="/contacto">Quiero saber más</Link></article>)}</div><p className="fine-print">Valores referenciales en CLP. La implementación real, condiciones y alcance se definirán antes de contratar.</p></section><SiteFooter/></main>;
}

