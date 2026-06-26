"use client";

import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { createAdminAppointmentAction } from "@/app/admin/citas/actions";
import { formatClp, formatDuration } from "@/lib/formatting";
import type { AdminAppointmentFormData, AdminAppointmentFormLoadState } from "@/types/admin-appointment-form";

interface FormState {
  customerId: string;
  serviceId: string;
  professionalId: string;
  locationId: string;
  date: string;
  time: string;
}

interface TimeOption {
  time: string;
  isAvailable: boolean;
  reason?: string;
}

const DEFAULT_TIME_ZONE = "America/Santiago";
const SLOT_STEP_MINUTES = 30;
const PAST_DATE_MESSAGE = "No puedes crear una cita en una fecha pasada.";
const initialFormState: FormState = {
  customerId: "",
  serviceId: "",
  professionalId: "",
  locationId: "",
  date: todayInSantiago(),
  time: "",
};
const weekdayByShortLabel: Record<string, "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY"> = {
  Mon: "MONDAY",
  Tue: "TUESDAY",
  Wed: "WEDNESDAY",
  Thu: "THURSDAY",
  Fri: "FRIDAY",
  Sat: "SATURDAY",
  Sun: "SUNDAY",
};

export function AdminNewAppointmentPanel({ form }: { form?: AdminAppointmentFormLoadState | null }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!form) {
    return <UnavailableAppointmentButton message="No pudimos cargar los datos para crear una cita. Intenta nuevamente."/>;
  }

  if (form.status !== "ready") {
    return <UnavailableAppointmentButton message={form.message}/>;
  }

  const disabledReason = getDisabledReason(form.data);
  if (disabledReason) {
    return <UnavailableAppointmentButton message={disabledReason}/>;
  }

  return <div>
    <button className="button" type="button" onClick={() => setIsOpen(true)}>Nueva cita</button>
    {message && <small style={{ display: "block", marginTop: 8, color: message.type === "success" ? "#397052" : "#925650" }}>{message.text}</small>}
    {isOpen && <AppointmentFormDialog
      data={form.data}
      formState={formState}
      isPending={isPending}
      onChange={(patch) => {
        setFormState((current) => ({ ...current, ...patch }));
        setMessage(null);
      }}
      onClose={() => setIsOpen(false)}
      onSubmit={(error) => {
        if (error) {
          setMessage({ type: "error", text: error });
          return;
        }

        startTransition(async () => {
          const result = await createAdminAppointmentAction({
            businessSlug: form.data.businessSlug,
            ...formState,
          });

          if (result.ok) {
            setMessage({ type: "success", text: "Cita creada correctamente." });
            setFormState(initialFormState);
            setIsOpen(false);
            router.refresh();
            return;
          }

          setMessage({ type: "error", text: result.message });
        });
      }}
    />}
  </div>;
}

function UnavailableAppointmentButton({ message }: { message: string }) {
  return <div>
    <button className="button" type="button" disabled>Nueva cita</button>
    <small style={{ display: "block", marginTop: 8, color: "#925650", maxWidth: 280 }}>{message}</small>
  </div>;
}

function AppointmentFormDialog({
  data,
  formState,
  isPending,
  onChange,
  onClose,
  onSubmit,
}: {
  data: AdminAppointmentFormData;
  formState: FormState;
  isPending: boolean;
  onChange: (patch: Partial<FormState>) => void;
  onClose: () => void;
  onSubmit: (error?: string) => void;
}) {
  const selectedService = data.services.find((service) => service.id === formState.serviceId);
  const selectedProfessional = data.professionals.find(
    (professional) => professional.id === formState.professionalId,
  );
  const compatibleLocationIds = useMemo(
    () => formState.professionalId
      ? data.locationsByProfessionalId[formState.professionalId] ?? []
      : [],
    [data.locationsByProfessionalId, formState.professionalId],
  );
  const compatibleLocations = useMemo(
    () => data.locations.filter((location) => compatibleLocationIds.includes(location.id)),
    [compatibleLocationIds, data.locations],
  );
  const selectedLocation = data.locations.find((location) => location.id === formState.locationId);
  const timeOptions = useMemo(
    () => buildTimeOptions(data, formState, selectedService?.durationMinutes ?? 0),
    [data, formState, selectedService?.durationMinutes],
  );
  const todayDate = todayInSantiago();
  const selectedTimeOption = timeOptions.find((option) => option.time === formState.time);
  const hasAvailableTimes = timeOptions.some((option) => option.isAvailable);

  useEffect(() => {
    if (compatibleLocations.length === 1 && formState.locationId !== compatibleLocations[0]?.id) {
      onChange({ locationId: compatibleLocations[0].id, time: "" });
    }

    if (formState.locationId && !compatibleLocationIds.includes(formState.locationId)) {
      onChange({ locationId: "", time: "" });
    }
  }, [compatibleLocationIds, compatibleLocations, formState.locationId, onChange]);

  useEffect(() => {
    if (formState.time && (!selectedTimeOption || !selectedTimeOption.isAvailable)) {
      onChange({ time: "" });
    }
  }, [formState.time, onChange, selectedTimeOption]);

  const disabledReason = getDisabledReason(data);

  return <AppointmentDialog title="Nueva cita" onClose={onClose}>
    {disabledReason
      ? <Notice title="Faltan datos reales" message={disabledReason}/>
      : <form onSubmit={(event) => {
        event.preventDefault();
        onSubmit(validateForm(data, formState, timeOptions));
      }}>
        <div className="form-grid">
          <label>Cliente<select value={formState.customerId} onChange={(event) => onChange({ customerId: event.target.value })}><option value="">Selecciona cliente</option>{data.customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.fullName} - {customer.phone}</option>)}</select></label>
          <label>Servicio<select value={formState.serviceId} onChange={(event) => onChange({ serviceId: event.target.value, time: "" })}><option value="">Selecciona servicio</option>{data.services.map((service) => <option key={service.id} value={service.id}>{service.name} - {formatClp(service.priceFrom)}</option>)}</select></label>
          <label>Profesional<select value={formState.professionalId} onChange={(event) => onChange({ professionalId: event.target.value, locationId: "", time: "" })}><option value="">Selecciona profesional</option>{data.professionals.map((professional) => <option key={professional.id} value={professional.id}>{professional.displayName}{professional.roleTitle ? ` - ${professional.roleTitle}` : ""}</option>)}</select></label>
          <label>Ubicación<select value={formState.locationId} onChange={(event) => onChange({ locationId: event.target.value, time: "" })} disabled={!formState.professionalId || compatibleLocations.length === 0}><option value="">Selecciona ubicación</option>{compatibleLocations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
        </div>
        <div style={{ display: "grid", gap: 14, marginTop: 18 }}>
          <label style={{ display: "grid", gap: 8, fontSize: 13, fontWeight: 700 }}>Fecha de la cita<input type="date" min={todayDate} value={formState.date} onChange={(event) => onChange({ date: event.target.value, time: "" })} style={{ minHeight: 50, fontSize: 16 }}/></label>
          <div>
            <div className="panel-heading" style={{ marginBottom: 10 }}>
              <div>
                <h2 style={{ fontSize: 18 }}>Hora de inicio</h2>
                <p>Horarios según disponibilidad real del profesional, ubicación y día seleccionados.</p>
              </div>
            </div>
            {!formState.serviceId || !formState.professionalId || !formState.locationId
              ? <Notice title="Selecciona los datos primero" message="Elige servicio, profesional y ubicación para ver horarios disponibles."/>
              : timeOptions.length === 0 || !hasAvailableTimes
                ? <Notice title="Sin horarios disponibles" message="No hay horarios disponibles para esta fecha. Prueba con otro día u otro profesional."/>
                : <TimeSlotGrid options={timeOptions} selectedTime={formState.time} onSelect={(time) => onChange({ time })}/>}
          </div>
        </div>
        <div className="demo-notice" style={{ marginTop: 18 }}>
          <span>
            <strong>Resumen</strong>
            {selectedService ? `${selectedService.name} - ${formatDuration(selectedService.durationMinutes)} - ${formatClp(selectedService.priceFrom)}` : "Selecciona un servicio."}
            {selectedProfessional ? ` Profesional: ${selectedProfessional.displayName}.` : ""}
            {selectedLocation ? ` Ubicación: ${selectedLocation.name}.` : ""}
            {formState.time ? ` Hora: ${formState.time}.` : ""}
          </span>
        </div>
        <div className="demo-notice" style={{ marginTop: 12 }}>
          <span><strong>Recomendación</strong>Te recomendamos llegar 5 minutos antes.</span>
        </div>
        {selectedProfessional && selectedService && !selectedProfessional.services.some((service) => service.id === selectedService.id)
          ? <Notice title="Servicio no compatible" message="El profesional seleccionado no realiza este servicio."/>
          : null}
        {formState.professionalId && compatibleLocations.length === 0
          ? <Notice title="Sin ubicaciones disponibles" message="El profesional seleccionado no tiene ubicaciones activas."/>
          : null}
        <div className="button-row" style={{ justifyContent: "flex-end", marginTop: 18 }}>
          <button className="button button--ghost" type="button" onClick={onClose} disabled={isPending}>Cerrar</button>
          <button className="button" type="submit" disabled={isPending || !formState.time}>{isPending ? "Creando..." : "Crear cita"}</button>
        </div>
      </form>}
  </AppointmentDialog>;
}

function TimeSlotGrid({
  options,
  selectedTime,
  onSelect,
}: {
  options: TimeOption[];
  selectedTime: string;
  onSelect: (time: string) => void;
}) {
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(112px, 1fr))", gap: 10 }}>
    {options.map((option) => <button
      key={option.time}
      type="button"
      aria-pressed={selectedTime === option.time}
      disabled={!option.isAvailable}
      onClick={() => onSelect(option.time)}
      title={option.reason}
      style={{
        minHeight: 58,
        borderRadius: 18,
        border: selectedTime === option.time ? "1px solid rgba(58, 73, 45, .95)" : "1px solid rgba(58, 73, 45, .18)",
        background: option.isAvailable ? selectedTime === option.time ? "rgba(58, 73, 45, .14)" : "rgba(255,255,255,.7)" : "rgba(146, 86, 80, .08)",
        color: option.isAvailable ? "#2d3328" : "#8d7169",
        cursor: option.isAvailable ? "pointer" : "not-allowed",
        display: "grid",
        gap: 2,
        padding: "8px 10px",
        textAlign: "left",
      }}
    >
      <strong>{option.time}</strong>
      <small>{option.isAvailable ? "Disponible" : option.reason}</small>
    </button>)}
  </div>;
}

function AppointmentDialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return <div role="presentation" style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(24,25,22,.55)", display: "grid", placeItems: "center", padding: 18 }}>
    <section className="admin-panel" role="dialog" aria-modal="true" aria-label={title} style={{ width: "min(760px, 100%)", maxHeight: "90vh", overflowY: "auto" }}>
      <div className="panel-heading"><div><h2>{title}</h2><p>Completa los datos para crear una reserva real.</p></div><button className="button button--ghost" type="button" onClick={onClose}>Cerrar</button></div>
      {children}
    </section>
  </div>;
}

function Notice({ title, message }: { title: string; message: string }) {
  return <div className="demo-notice" style={{ marginTop: 14 }}><span><strong>{title}</strong>{message}</span></div>;
}

function validateForm(data: AdminAppointmentFormData, formState: FormState, timeOptions: TimeOption[]): string | undefined {
  if (!formState.customerId || !formState.serviceId || !formState.professionalId || !formState.locationId || !formState.date || !formState.time) {
    return "Completa todos los campos antes de crear la cita.";
  }

  if (formState.date < todayInSantiago()) {
    return PAST_DATE_MESSAGE;
  }

  const professional = data.professionals.find((item) => item.id === formState.professionalId);
  if (!professional?.services.some((service) => service.id === formState.serviceId)) {
    return "El profesional seleccionado no realiza este servicio.";
  }

  if (!(data.locationsByProfessionalId[formState.professionalId] ?? []).includes(formState.locationId)) {
    return "La ubicación seleccionada no corresponde al profesional.";
  }

  if (!timeOptions.some((option) => option.time === formState.time && option.isAvailable)) {
    return "Selecciona un horario disponible para esta fecha.";
  }

  return undefined;
}

function buildTimeOptions(data: AdminAppointmentFormData, formState: FormState, durationMinutes: number): TimeOption[] {
  if (!formState.date || !formState.serviceId || !formState.professionalId || !formState.locationId || durationMinutes <= 0) {
    return [];
  }

  const availability = data.availabilityByProfessionalId[formState.professionalId];
  if (!availability) {
    return [];
  }

  const weekday = getWeekdayForSantiagoDate(formState.date);
  const businessHours = availability.businessHours.filter((rule) =>
    rule.weekday === weekday && (rule.locationId === null || rule.locationId === formState.locationId),
  );
  const professionalRules = availability.weeklyRules.filter((rule) =>
    rule.weekday === weekday && rule.locationId === formState.locationId,
  );
  const intervals = intersectIntervals(
    businessHours.map((rule) => [timeToMinutes(rule.opensAtLocal), timeToMinutes(rule.closesAtLocal)]),
    professionalRules.map((rule) => [timeToMinutes(rule.startsAtLocal), timeToMinutes(rule.endsAtLocal)]),
  );

  if (intervals.length === 0) {
    return [];
  }

  const now = getSantiagoNow();
  const isToday = formState.date === now.date;
  const options: TimeOption[] = [];

  for (const [startsAt, endsAt] of intervals) {
    for (let minute = startsAt; minute + durationMinutes <= endsAt; minute += SLOT_STEP_MINUTES) {
      const time = minutesToTime(minute);
      const slotEnd = minute + durationMinutes;
      const reason = getUnavailableReason({
        date: formState.date,
        minute,
        slotEnd,
        isToday,
        nowMinutes: now.minutes,
        locationId: formState.locationId,
        timeOff: availability.timeOff,
      });

      options.push({
        time,
        isAvailable: !reason,
        reason,
      });
    }
  }

  return dedupeTimeOptions(options);
}

function getUnavailableReason({
  date,
  minute,
  slotEnd,
  isToday,
  nowMinutes,
  locationId,
  timeOff,
}: {
  date: string;
  minute: number;
  slotEnd: number;
  isToday: boolean;
  nowMinutes: number;
  locationId: string;
  timeOff: AdminAppointmentFormData["availabilityByProfessionalId"][string]["timeOff"];
}): string | undefined {
  if (isToday && minute <= nowMinutes) {
    return "Hora pasada";
  }

  if (timeOff.some((entry) => timeOffOverlapsSlot(entry, date, minute, slotEnd, locationId))) {
    return "Bloqueado";
  }

  return undefined;
}

function timeOffOverlapsSlot(
  entry: AdminAppointmentFormData["availabilityByProfessionalId"][string]["timeOff"][number],
  date: string,
  slotStart: number,
  slotEnd: number,
  locationId: string,
) {
  if (entry.locationId && entry.locationId !== locationId) {
    return false;
  }

  const start = getSantiagoDateTimeParts(new Date(entry.startsAt));
  const end = getSantiagoDateTimeParts(new Date(entry.endsAt));

  if (date < start.date || date > end.date) {
    return false;
  }

  const blockedStart = date === start.date ? start.minutes : 0;
  const blockedEnd = date === end.date ? end.minutes : 24 * 60;

  return slotStart < blockedEnd && slotEnd > blockedStart;
}

function intersectIntervals(baseIntervals: number[][], overlayIntervals: number[][]) {
  const intervals: number[][] = [];

  for (const base of baseIntervals) {
    for (const overlay of overlayIntervals) {
      const startsAt = Math.max(base[0], overlay[0]);
      const endsAt = Math.min(base[1], overlay[1]);

      if (startsAt < endsAt) {
        intervals.push([startsAt, endsAt]);
      }
    }
  }

  return intervals.sort((left, right) => left[0] - right[0] || left[1] - right[1]);
}

function dedupeTimeOptions(options: TimeOption[]) {
  const byTime = new Map<string, TimeOption>();

  for (const option of options) {
    const existing = byTime.get(option.time);
    if (!existing || (!existing.isAvailable && option.isAvailable)) {
      byTime.set(option.time, option);
    }
  }

  return [...byTime.values()].sort((left, right) => left.time.localeCompare(right.time));
}

function getDisabledReason(data: AdminAppointmentFormData): string | undefined {
  if (data.customers.length === 0) {
    return "No hay clientes reales disponibles para crear una cita.";
  }

  if (data.services.length === 0) {
    return "No hay servicios reales activos para crear una cita.";
  }

  if (data.professionals.length === 0) {
    return "No hay profesionales reales activos para crear una cita.";
  }

  if (data.locations.length === 0) {
    return "No hay ubicaciones reales activas asociadas a profesionales.";
  }

  return undefined;
}

function todayInSantiago() {
  return getSantiagoDateTimeParts(new Date()).date;
}

function getSantiagoNow() {
  return getSantiagoDateTimeParts(new Date());
}

function getSantiagoDateTimeParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: DEFAULT_TIME_ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    minutes: Number(values.hour) * 60 + Number(values.minute),
  };
}

function getWeekdayForSantiagoDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: DEFAULT_TIME_ZONE,
    weekday: "short",
  }).format(new Date(Date.UTC(year, month - 1, day, 12, 0, 0)));

  return weekdayByShortLabel[weekday] ?? "MONDAY";
}

function timeToMinutes(time: string) {
  const [hour, minute] = time.split(":").map(Number);

  return hour * 60 + minute;
}

function minutesToTime(minutes: number) {
  const hour = Math.floor(minutes / 60).toString().padStart(2, "0");
  const minute = (minutes % 60).toString().padStart(2, "0");

  return `${hour}:${minute}`;
}
