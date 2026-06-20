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
  return <main><SiteHeader/><section className="page-hero pricing-hero subtle-gradient"><div className="container animate-fade-in"><span className="eyebrow">PLANES REFERENCIALES</span><h1>Tu próxima reserva<br/><em>puede empezar aquí.</em></h1><p>Una presencia premium, una agenda más ordenada y una experiencia que trabaja por tu marca incluso cuando el salón está cerrado.</p></div></section><section className="section section--tight"><div className="container pricing-grid">{plans.map((plan) => <article className={`price-card premium-card${plan.featured ? " is-featured premium-shadow" : ""}`} key={plan.name}>{plan.featured && <span className="popular-label">EXPERIENCIA RECOMENDADA</span>}<small className="plan-kicker">VELORA · {plan.name.toUpperCase()}</small><h2>{plan.name}</h2><p>{plan.text}</p><div className="price"><strong>{plan.price}</strong>{plan.price.startsWith("$") && <span>/ mes</span>}</div><ul>{plan.items.map((item) => <li key={item}><Icon name="check" size={17}/>{item}</li>)}</ul><Link className={`button${plan.featured ? "" : " button--ghost"}`} href="/contacto">Quiero saber más</Link></article>)}</div><p className="fine-print">Valores referenciales en CLP. La implementación real, condiciones y alcance se definirán antes de contratar.</p></section><SiteFooter/></main>;
}
