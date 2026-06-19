"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { Icon } from "@/components/ui/icon";
import { businesses, professionals, services } from "@/data/demo";
import { formatClp } from "@/lib/formatting";
import type { BookingDraft } from "@/types/demo";

export function ConfirmationCard() {
  const stored = useSyncExternalStore(
    () => () => undefined,
    () => sessionStorage.getItem("velora-demo-booking"),
    () => null,
  );
  const draft = useMemo(() => {
    try { return stored ? JSON.parse(stored) as BookingDraft : null; } catch { return null; }
  }, [stored]);
  if (!draft) return <div className="confirmation-card empty-confirmation"><span className="confirm-icon"><Icon name="calendar" size={30}/></span><h1>No hay una reserva demo activa</h1><p>Inicia el flujo para crear una simulación de reserva en este navegador.</p><Link className="button" href="/reservar">Comenzar demo <Icon name="arrow"/></Link></div>;
  const business = businesses.find((item) => item.businessId === draft.businessId);
  const service = services.find((item) => item.serviceId === draft.serviceId);
  const professional = professionals.find((item) => item.professionalId === draft.professionalId);
  return <div className="confirmation-card"><span className="confirm-icon"><Icon name="check" size={32}/></span><span className="eyebrow">SIMULACIÓN COMPLETADA</span><h1>Así se vería tu confirmación, {draft.clientName.split(" ")[0]}.</h1><p>La experiencia quedó lista para mostrar. Revisa el resumen de esta reserva ficticia.</p><div className="confirmation-details"><div><span>Negocio demo</span><strong>{business?.name}</strong></div><div><span>Servicio</span><strong>{service?.name}</strong></div><div><span>Profesional ficticio</span><strong>{professional?.name}</strong></div><div><span>Fecha y hora</span><strong>{draft.date.split("-").reverse().join("/")} · {draft.time}</strong></div><div><span>Total estimado</span><strong>{service ? formatClp(service.priceClp) : "—"}</strong></div></div><div className="critical-demo-notice"><Icon name="sparkles"/><div><strong>Esto fue solo una reserva demo</strong><p>No fue enviada a ningún negocio real, no bloqueó un horario y no generó cobros.</p></div></div><div className="button-row button-row--center"><Link className="button" href={`/reservar?negocio=${draft.vertical}`}>Probar otra reserva</Link><Link className="button button--ghost" href="/">Volver al inicio</Link></div></div>;
}
