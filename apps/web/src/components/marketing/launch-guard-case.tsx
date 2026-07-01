import Link from "next/link";
import { Icon } from "@/components/ui/icon";

/* ─────────────────────────────────────────────────────────────────────────────
   LaunchGuardCase — Caso Demo 001 · Dafory Launch Guard
   Sección visual premium para la landing de Velora Reservas.

   Copy basado en: docs/marketing/launch-guard-velora-demo-copy.md
   Caso:           docs/case-studies/velora-reservas-demo-001.md

   • Server component — sin "use client".
   • No toca lógica de negocio, backend ni admin.
   • Solo evidencia visual para pitch/landing.
   ───────────────────────────────────────────────────────────────────────────── */

const steps = [
  {
    num: "01",
    label: "Evidencia visual",
    detail: "17 capturas desktop y mobile generadas con Playwright.",
  },
  {
    num: "02",
    label: "Flujo completo auditado",
    detail: "Landing, reserva paso a paso, confirmación y panel admin.",
  },
  {
    num: "03",
    label: "Veredicto diferenciado",
    detail: "Preparación para demo vs. readiness comercial real, por separado.",
  },
  {
    num: "04",
    label: "Backlog priorizado",
    detail: "Riesgos documentados y pasos claros hacia el go-live.",
  },
];

export function LaunchGuardCase() {
  return (
    <section className="lg-section" aria-labelledby="lg-heading">
      <div className="container">

        {/* ── Cabecera ──────────────────────────────────────────────── */}
        <div className="lg-header">
          <div className="lg-badges">
            <span className="lg-badge lg-badge--case">CASO DEMO 001</span>
            <span className="lg-badge lg-badge--evidence">EVIDENCE PACK · PLAYWRIGHT</span>
          </div>
          <span className="eyebrow eyebrow--light">DAFORY LAUNCH GUARD</span>
          <h2 id="lg-heading">
            Antes de lanzar tu SaaS,<br />
            <em>valida si está realmente listo.</em>
          </h2>
          <p>
            Launch Guard revisa tu producto digital antes de presentarlo a clientes,
            fondos o&nbsp;stakeholders. Generamos evidencia visual, detectamos riesgos,
            asignamos un veredicto de lanzamiento y entregamos un backlog priorizado.
          </p>
        </div>

        {/* ── Score + Veredictos ────────────────────────────────────── */}
        <div className="lg-results-row">

          {/* Score 17/17 */}
          <div className="lg-score-card premium-card">
            <div className="lg-score-inner">
              <div className="lg-score-ring" aria-hidden="true">
                <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="40" cy="40" r="34" stroke="rgba(255,255,255,.1)" strokeWidth="7"/>
                  <circle
                    cx="40" cy="40" r="34"
                    stroke="url(#lg-arc)"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray="213.6"
                    strokeDashoffset="0"
                    transform="rotate(-90 40 40)"
                  />
                  <defs>
                    <linearGradient id="lg-arc" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#78d9a0"/>
                      <stop offset="1" stopColor="#3ba86a"/>
                    </linearGradient>
                  </defs>
                </svg>
                <span className="lg-score-number">17<small>/17</small></span>
              </div>
              <div className="lg-score-meta">
                <strong>Capturas PASS</strong>
                <small>0 WARNING · 0 FAIL</small>
                <span className="lg-score-tech">Chromium · 35.4 s</span>
              </div>
            </div>
            <div className="lg-score-foot">
              <Icon name="check" size={14} />
              <span>Evidence Pack generado automáticamente</span>
            </div>
          </div>

          {/* Veredictos */}
          <div className="lg-verdicts">
            {/* APPROVED_WITH_WARNINGS */}
            <div className="lg-verdict lg-verdict--approved">
              <div className="lg-verdict-icon" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m5 12 4 4L19 6"/>
                </svg>
              </div>
              <div className="lg-verdict-body">
                <span className="lg-verdict-tag">APPROVED_WITH_WARNINGS</span>
                <strong>Demo visual controlada</strong>
                <p>
                  Flujo público, reserva demo y landing listos para presentar
                  a clientes y stakeholders con guion claro.
                </p>
              </div>
            </div>

            {/* NEEDS_FIXES */}
            <div className="lg-verdict lg-verdict--warning">
              <div className="lg-verdict-icon" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div className="lg-verdict-body">
                <span className="lg-verdict-tag">NEEDS_FIXES</span>
                <strong>Operación comercial real</strong>
                <p>
                  Admin requiere configuración de API y datos reales.
                  Reservas funcionan como demo local, no como transacción persistente.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Proceso en 4 pasos ────────────────────────────────────── */}
        <div className="lg-steps">
          {steps.map((step) => (
            <div className="lg-step" key={step.num}>
              <span className="lg-step-num" aria-hidden="true">{step.num}</span>
              <strong>{step.label}</strong>
              <p>{step.detail}</p>
            </div>
          ))}
        </div>

        {/* ── Mensaje comercial + CTA ───────────────────────────────── */}
        <div className="lg-cta-block">
          <div className="lg-cta-copy">
            <p>
              No basta con que tu producto <em>&ldquo;se vea bien&rdquo;</em>. Antes de lanzarlo,
              necesitas saber qué está listo, qué puede fallar y qué debes corregir primero.
            </p>
            <p className="lg-cta-sub">
              Launch Guard convierte una revisión técnica en una decisión clara de negocio.
            </p>
          </div>
          <div className="lg-cta-actions">
            <Link className="button" href="/contacto">
              Solicitar revisión Launch Guard
              <Icon name="arrow" />
            </Link>
            <Link
              className="text-link text-link--light"
              href="/docs/launch-guard-evidence/velora-reservas/evidence-index.md"
              target="_blank"
              rel="noopener noreferrer"
            >
              Ver evidencia técnica
            </Link>
          </div>
        </div>

        {/* ── Nota honesta de pie ───────────────────────────────────── */}
        <p className="lg-disclaimer">
          Demo visual, no operación comercial real · Caso Demo 001 auditado el 01/07/2026 · Branch chore/launch-guard-velora-evidence-001
        </p>

      </div>
    </section>
  );
}
