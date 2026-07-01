"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { getBusiness, getProfessionals, getServices } from "@/data/demo";
import { formatClp, formatDuration } from "@/lib/formatting";
import type { BookingDraft, BusinessVertical } from "@/types/demo";

const times = ["09:30", "10:30", "11:45", "14:00", "15:30", "17:00", "18:30"];
const DEFAULT_TIME_ZONE = "America/Santiago";

export function BookingFlow({ vertical, initialServiceId }: { vertical: BusinessVertical; initialServiceId?: string }) {
  const router = useRouter();
  const business = getBusiness(vertical);
  const availableServices = getServices(vertical);
  const [step, setStep] = useState(1);
  const [serviceId, setServiceId] = useState(availableServices.some((service) => service.serviceId === initialServiceId) ? initialServiceId! : "");
  const [professionalId, setProfessionalId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const selectedService = availableServices.find((item) => item.serviceId === serviceId);
  const professionals = useMemo(() => getProfessionals(vertical).filter((item) => !serviceId || item.serviceIds.includes(serviceId)), [vertical, serviceId]);
  const selectedProfessional = professionals.find((item) => item.professionalId === professionalId);
  const today = todayInSantiago();

  const canContinue = step === 1 ? Boolean(serviceId) : step === 2 ? Boolean(professionalId && date && time) : Boolean(clientName.trim() && clientPhone.trim());

  function confirmDemo() {
    if (!selectedService || !selectedProfessional || !canContinue) return;
    const draft: BookingDraft = {
      appointmentId: `demo_${Date.now()}`,
      businessId: business.businessId,
      serviceId,
      professionalId,
      clientId: "demo_client_session",
      vertical,
      date,
      time,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      clientEmail: clientEmail.trim(),
      status: "pending",
    };
    sessionStorage.setItem("velora-demo-booking", JSON.stringify(draft));
    router.push("/confirmacion");
  }

  return <div className={`booking-shell theme-${vertical}`}>
    <header className="booking-header"><Link href={`/${vertical}`} className="booking-back">← Volver</Link><div className="booking-brand"><strong>{business.name}</strong><span>{business.descriptor}</span></div><span className="demo-pill">MODO DEMO</span></header>
    <div className="booking-layout">
      <section className="booking-main">
        <div className="booking-progress"><span className={step >= 1 ? "active" : ""}><b>01</b><small>SERVICIO</small></span><i/><span className={step >= 2 ? "active" : ""}><b>02</b><small>PROFESIONAL</small></span><i/><span className={step >= 2 ? "active" : ""}><b>03</b><small>HORARIO</small></span><i/><span className={step >= 3 ? "active" : ""}><b>04</b><small>DATOS</small></span></div>
        {step === 1 && <div className="booking-step animate-fade-in"><span className="eyebrow">DISEÑA TU VISITA</span><h1>Tu experiencia de autocuidado comienza aquí.</h1><p>Selecciona un servicio para descubrir profesionales y horarios disponibles.</p><div className="booking-options">{availableServices.map((service) => <button type="button" className={`booking-option${serviceId === service.serviceId ? " selected" : ""}`} onClick={() => { setServiceId(service.serviceId); setProfessionalId(""); }} key={service.serviceId}><span><strong>{service.name}</strong><small><Icon name="clock" size={15}/>{formatDuration(service.durationMinutes)}</small></span><b>{formatClp(service.priceClp)}</b><i><Icon name="check" size={15}/></i></button>)}</div></div>}
        {step === 2 && <div className="booking-step animate-fade-in"><span className="eyebrow">PROFESIONAL · FECHA · HORA</span><h1>Elige quién y cuándo.</h1><p>Disponibilidad ficticia para visualizar una experiencia sin esperas.</p><h3 className="field-heading">Tu especialista</h3><div className="professional-options">{professionals.map((person) => <button type="button" className={professionalId === person.professionalId ? "selected" : ""} onClick={() => setProfessionalId(person.professionalId)} key={person.professionalId}><span>{person.initials}</span><strong>{person.name}</strong><small>{person.role}</small></button>)}</div><div className="date-time-grid"><label>Fecha<input type="date" min={today} value={date} onChange={(event) => setDate(event.target.value)}/></label><div><span className="input-label">Hora</span><div className="time-options">{times.map((slot) => <button type="button" className={time === slot ? "selected" : ""} onClick={() => setTime(slot)} key={slot}>{slot}</button>)}</div></div></div></div>}
        {step === 3 && <div className="booking-step animate-fade-in"><span className="eyebrow">ÚLTIMO PASO</span><h1>La reserva quedaría a tu nombre.</h1><p>Estos datos solo viven en tu navegador durante esta demostración.</p><div className="form-grid"><label>Nombre completo<input value={clientName} onChange={(event) => setClientName(event.target.value)} placeholder="Ej. Daniela Soto" autoComplete="name"/></label><label>Teléfono<input value={clientPhone} onChange={(event) => setClientPhone(event.target.value)} placeholder="+56 9 1234 5678" inputMode="tel" autoComplete="tel"/></label><label className="full">Correo <small>(opcional)</small><input value={clientEmail} onChange={(event) => setClientEmail(event.target.value)} placeholder="nombre@correo.cl" type="email" autoComplete="email"/></label></div><div className="privacy-note"><Icon name="check"/><span><strong>Demostración segura</strong>No se envían ni almacenan datos en un servidor.</span></div></div>}
        <div className="booking-actions">{step > 1 && <button type="button" className="button button--ghost" onClick={() => setStep(step - 1)}>Atrás</button>}<button type="button" className="button" disabled={!canContinue} onClick={() => step < 3 ? setStep(step + 1) : confirmDemo()}>{step === 3 ? "Confirmar reserva demo" : "Continuar"}<Icon name="arrow"/></button></div>
      </section>
      <aside className="booking-summary"><div className="ticket-top"><span>VELORA</span><small>EXPERIENCE PASS · DEMO</small></div><span className="eyebrow">TU EXPERIENCIA</span><h2>{business.name}</h2><p>{business.address}</p><div className="summary-lines"><div><span>Servicio</span><strong>{selectedService?.name ?? "Por elegir"}</strong></div><div><span>Especialista</span><strong>{selectedProfessional?.name ?? "Por elegir"}</strong></div><div><span>Fecha y hora</span><strong>{date ? `${date.split("-").reverse().join("/")} · ${time || "—"}` : "Por elegir"}</strong></div></div>{selectedService && <div className="summary-total"><span>Total estimado</span><strong>{formatClp(selectedService.priceClp)}</strong></div>}<div className="ticket-code" aria-hidden="true"><i/><i/><i/><i/><i/><i/><i/><i/><i/></div><small className="summary-demo">Vista previa · Esta reserva no será enviada.</small></aside>
    </div>
  </div>;
}

function todayInSantiago(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: DEFAULT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const valueByType = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${valueByType.year}-${valueByType.month}-${valueByType.day}`;
}
