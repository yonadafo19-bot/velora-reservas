import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Icon } from "@/components/ui/icon";
import { getBusiness, getProfessionals, getServices } from "@/data/demo";
import { formatClp, formatDuration } from "@/lib/formatting";
import type { BusinessVertical } from "@/types/demo";

export function VerticalPage({ vertical }: { vertical: BusinessVertical }) {
  const business = getBusiness(vertical);
  const verticalServices = getServices(vertical);
  const team = getProfessionals(vertical);
  const isBarber = vertical === "barberia";
  return (
    <main className={`vertical-page theme-${vertical}`}>
      <div className="vertical-hero">
        <SiteHeader inverse />
        <div className="vertical-art" aria-hidden="true"><div className="art-texture"/><div className="art-orbit"/><div className="art-mark">{isBarber ? "V/B" : "V·B"}</div><span className="art-signature">{isBarber ? "EST. MMXXVI" : "BEAUTY RITUALS"}</span></div>
        <div className="container vertical-hero__content animate-fade-in">
          <div className="eyebrow eyebrow--light">{business.descriptor}</div>
          <h1>{isBarber ? <>El ritual del<br/><em>buen corte.</em></> : <>Tu oasis de<br/><em>cuidado personal.</em></>}</h1>
          <p>{business.tagline}</p>
          <div className="button-row">
            <Link className="button button--theme" href={`/reservar?negocio=${vertical}`}>Reservar hora <Icon name="arrow" /></Link>
            <a className="text-link text-link--light" href="#servicios">Ver servicios</a>
          </div>
        </div>
        <div className="vertical-proof"><span>★ {business.rating}</span><span>{business.reviewCount} reseñas demo</span><span>Atención personalizada</span></div>
      </div>

      <section className="section" id="servicios">
        <div className="container">
          <div className="section-heading split-heading"><div><span className="eyebrow">SERVICIOS</span><h2>{isBarber ? "El ritual de verte bien" : "Detalles que hablan de ti"}</h2></div><p>Una carta cuidada, con tiempos claros y reserva inmediata.</p></div>
          <div className="service-list">
            {verticalServices.map((service, index) => (
              <article className={`service-row${service.featured ? " is-signature" : ""}`} key={service.serviceId}>
                <span className="service-index">0{index + 1}</span>
                <div><h3>{service.name}</h3><p>{service.description}</p></div>
                <span className="service-time">{formatDuration(service.durationMinutes)}</span>
                <strong>{formatClp(service.priceClp)}</strong>
                <Link href={`/reservar?negocio=${vertical}&servicio=${service.serviceId}`} aria-label={`Reservar ${service.name}`}><Icon name="arrow" /></Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--tint">
        <div className="container">
          <div className="section-heading"><span className="eyebrow">EL EQUIPO</span><h2>Especialistas en su oficio</h2><p>Perfiles completamente ficticios creados para esta demostración.</p></div>
          <div className="team-grid">
            {team.map((person, index) => <article className="team-card premium-card" key={person.professionalId}><div className="portrait-placeholder"><i>0{index + 1}</i><span>{person.initials}</span></div><div className="team-card__copy"><h3>{person.name}</h3><p>{person.role}</p><small>PERFIL DEMOSTRATIVO</small></div></article>)}
          </div>
        </div>
      </section>

      <section className="vertical-cta"><div className="container"><span className="eyebrow eyebrow--light">TU PRÓXIMA VISITA</span><h2>Reserva en menos de un minuto.</h2><p>Elige tu servicio, profesional y horario. Sin llamadas ni esperas.</p><Link className="button button--light" href={`/reservar?negocio=${vertical}`}>Reservar ahora <Icon name="arrow" /></Link></div></section>
      <SiteFooter />
    </main>
  );
}
