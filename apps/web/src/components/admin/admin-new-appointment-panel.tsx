"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import {
  createAdminAppointmentAction,
  loadAdminAppointmentAvailabilityAction,
  loadAdminAppointmentFormAction,
} from "@/app/admin/citas/actions";
import { formatClp, formatDuration } from "@/lib/formatting";
import type {
  AdminAppointmentAvailabilityLoadState,
  AdminAppointmentFormData,
  AdminAppointmentFormLoadState,
} from "@/types/admin-appointment-form";

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

export function AdminNewAppointmentPanel({ businessSlug }: { businessSlug: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<AdminAppointmentFormLoadState | null>(null);
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [isCreating, startCreateTransition] = useTransition();
  const [, startFormTransition] = useTransition();

  const loadForm = () => {
    startFormTransition(async () => {
      setDialogError(null);
      setForm(await loadAdminAppointmentFormAction(businessSlug));
    });
  };

  return <div>
    <button className="button" type="button" onClick={() => {
      setDialogError(null);
      setIsOpen(true);
      if (!form) {
        loadForm();
      }
    }}>Nueva cita</button>
    {message && message.type === "success" && <small style={{ display: "block", marginTop: 8, color: "#397052", maxWidth: 260 }}>{message.text}</small>}
    {isOpen && (!form
      ? <AppointmentFormLoadingDialog onClose={() => {
        setIsOpen(false);
        setForm(null);
      }}/>
      : form.status !== "ready"
        ? <AppointmentFormErrorDialog message={form.message} onClose={() => setIsOpen(false)} onRetry={loadForm}/>
        : <AppointmentFormDialog
          data={form.data}
          errorMessage={dialogError}
          formState={formState}
          isPending={isCreating}
          onChange={(patch) => {
            setFormState((current) => ({ ...current, ...patch }));
            setDialogError(null);
            setMessage(null);
          }}
          onClose={() => {
            setDialogError(null);
            setIsOpen(false);
            setForm(null);
          }}
          onSubmit={(error) => {
            if (error) {
              setDialogError(error);
              return;
            }

            startCreateTransition(async () => {
              setDialogError(null);
              const result = await createAdminAppointmentAction({
                businessSlug: form.data.businessSlug,
                ...formState,
              });

              if (result.ok) {
                setMessage({ type: "success", text: "Cita creada correctamente." });
                setFormState(initialFormState);
                setForm(null);
                setIsOpen(false);
                router.refresh();
                return;
              }

              if (isCompatibilityError(result.code)) {
                setFormState((current) => ({
                  ...current,
                  professionalId: "",
                  locationId: "",
                  time: "",
                }));
                setDialogError("Las opciones de profesional o ubicaciÃ³n cambiaron. Vuelve a elegirlas e intenta nuevamente.");
                startFormTransition(async () => {
                  setForm(await loadAdminAppointmentFormAction(businessSlug));
                });
                return;
              }

              setDialogError(result.message);
            });
          }}
        />)}
  </div>;
}

function AppointmentFormLoadingDialog({ onClose }: { onClose: () => void }) {
  return <AppointmentDialog title="Nueva cita" onClose={onClose}>
    <div className="admin-dialog-loading" aria-live="polite" aria-busy="true">
      <div className="admin-skeleton admin-skeleton--line admin-skeleton--wide"/>
      <div className="admin-skeleton-grid"><div/><div/><div/><div/></div>
      <p>Preparando datos de la cita…</p>
    </div>
  </AppointmentDialog>;
}

function AppointmentFormErrorDialog({
  message,
  onClose,
  onRetry,
}: {
  message: string;
  onClose: () => void;
  onRetry: () => void;
}) {
  return <AppointmentDialog title="Nueva cita" onClose={onClose}>
    <Notice title="No pudimos preparar la cita" message={message} mode="error"/>
    <div className="admin-action-row admin-dialog-retry">
      <button className="button button--ghost" type="button" onClick={onClose}>Cerrar</button>
      <button className="button" type="button" onClick={onRetry}>Reintentar</button>
    </div>
  </AppointmentDialog>;
}

function AppointmentFormDialog({
  data,
  errorMessage,
  formState,
  isPending,
  onChange,
  onClose,
  onSubmit,
}: {
  data: AdminAppointmentFormData;
  errorMessage?: string | null;
  formState: FormState;
  isPending: boolean;
  onChange: (patch: Partial<FormState>) => void;
  onClose: () => void;
  onSubmit: (error?: string) => void;
}) {
  const availabilityRequestId = useRef(0);
  const availabilityCache = useRef(new Map<string, AdminAppointmentAvailabilityLoadState>());
  const availabilityRequests = useRef(new Map<string, Promise<AdminAppointmentAvailabilityLoadState>>());
  const [availabilityState, setAvailabilityState] = useState<AdminAppointmentAvailabilityLoadState | null>(null);
  const [availabilityRetry, setAvailabilityRetry] = useState(0);
  const [isAvailabilityPending, startAvailabilityTransition] = useTransition();
  const resolvedData = useMemo(() => {
    if (availabilityState?.status !== "ready") {
      return data;
    }

    const { professionalId, availability } = availabilityState.data;
    return {
      ...data,
      availabilityByProfessionalId: {
        ...data.availabilityByProfessionalId,
        [professionalId]: availability,
      },
    };
  }, [availabilityState, data]);
  const selectedService = data.services.find((service) => service.id === formState.serviceId);
  const compatibleProfessionals = useMemo(
    () => formState.serviceId
      ? data.professionals.filter((professional) =>
        professional.locations.length > 0
        && professional.services.some((service) => service.id === formState.serviceId),
      )
      : [],
    [data.professionals, formState.serviceId],
  );
  const selectedProfessional = data.professionals.find(
    (professional) => professional.id === formState.professionalId,
  );
  const compatibleLocations = useMemo(
    () => selectedProfessional?.locations ?? [],
    [selectedProfessional],
  );
  const selectedLocation = compatibleLocations.find((location) => location.id === formState.locationId);
  const timeOptions = useMemo(
    () => buildTimeOptions(resolvedData, formState, selectedService?.durationMinutes ?? 0),
    [formState, resolvedData, selectedService?.durationMinutes],
  );
  const todayDate = todayInSantiago();
  const selectedTimeOption = timeOptions.find((option) => option.time === formState.time);
  const hasAvailableTimes = timeOptions.some((option) => option.isAvailable);

  useEffect(() => {
    if (formState.time && (!selectedTimeOption || !selectedTimeOption.isAvailable)) {
      onChange({ time: "" });
    }
  }, [formState.time, onChange, selectedTimeOption]);

  const disabledReason = getDisabledReason(data);

  const hasValidAvailabilitySelection = Boolean(
    formState.serviceId
    && selectedProfessional?.services.some((service) => service.id === formState.serviceId)
    && formState.locationId
    && selectedProfessional?.locations.some((location) => location.id === formState.locationId)
    && /^\d{4}-\d{2}-\d{2}$/.test(formState.date)
    && formState.date >= todayDate,
  );

  useEffect(() => {
    const requestId = availabilityRequestId.current + 1;
    availabilityRequestId.current = requestId;

    if (!hasValidAvailabilitySelection || !selectedProfessional) {
      return;
    }

    const cached = availabilityCache.current.get(selectedProfessional.id);
    if (cached) {
      startAvailabilityTransition(async () => {
        await Promise.resolve();
        if (availabilityRequestId.current === requestId) {
          setAvailabilityState(cached);
        }
      });
      return;
    }

    const professionalId = selectedProfessional.id;
    let availabilityRequest = availabilityRequests.current.get(professionalId);
    if (!availabilityRequest) {
      availabilityRequest = loadAdminAppointmentAvailabilityAction({
        businessSlug: data.businessSlug,
        professionalId,
      }).catch(() => ({
        status: "error" as const,
        message: "No pudimos cargar los horarios. Intenta nuevamente.",
      }));
      availabilityRequests.current.set(professionalId, availabilityRequest);
    }

    startAvailabilityTransition(async () => {
      const result = await availabilityRequest;
      if (availabilityRequests.current.get(professionalId) === availabilityRequest) {
        availabilityRequests.current.delete(professionalId);
      }
      if (availabilityRequestId.current === requestId) {
        const selectedLocationStillAllowed = result.status !== "ready"
          || result.data.locations.some((location) => location.id === formState.locationId);
        const nextResult = selectedLocationStillAllowed
          ? result
          : {
              status: "error" as const,
              message: "Las opciones del profesional cambiaron. Vuelve a seleccionarlo.",
            };
        availabilityCache.current.set(professionalId, nextResult);
        setAvailabilityState(nextResult);
      }
    });
  }, [
    availabilityRetry,
    data.businessSlug,
    formState.date,
    formState.locationId,
    formState.serviceId,
    hasValidAvailabilitySelection,
    selectedProfessional,
  ]);

  return <AppointmentDialog title="Nueva cita" onClose={onClose}>
    {disabledReason
      ? <Notice title="Faltan datos" message={disabledReason} mode="warning"/>
      : <form onSubmit={(event) => {
        event.preventDefault();
        onSubmit(validateForm(resolvedData, formState, timeOptions));
      }}>
        <div className="admin-field-grid">
          <label>Cliente<select value={formState.customerId} onChange={(event) => onChange({ customerId: event.target.value })}><option value="">Selecciona cliente</option>{data.customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.fullName} - {customer.phone}</option>)}</select></label>
          <label>Servicio<select value={formState.serviceId} onChange={(event) => {
            const serviceId = event.target.value;
            const professionalRemainsCompatible = Boolean(
              serviceId
              && selectedProfessional?.locations.length
              && selectedProfessional.services.some((service) => service.id === serviceId),
            );
            const locationRemainsCompatible = professionalRemainsCompatible
              && selectedProfessional?.locations.some((location) => location.id === formState.locationId);
            onChange({
              serviceId,
              professionalId: professionalRemainsCompatible ? formState.professionalId : "",
              locationId: locationRemainsCompatible
                ? formState.locationId
                : professionalRemainsCompatible && selectedProfessional?.locations.length === 1
                  ? selectedProfessional.locations[0].id
                  : "",
              time: "",
            });
          }}><option value="">Selecciona servicio</option>{data.services.map((service) => <option key={service.id} value={service.id}>{service.name} - {formatClp(service.priceFrom)}</option>)}</select></label>
          <label>Profesional<select value={formState.professionalId} onChange={(event) => {
            const professionalId = event.target.value;
            const professional = compatibleProfessionals.find((item) => item.id === professionalId);
            const locationId = professional?.locations.length === 1
              ? professional.locations[0].id
              : "";
            onChange({ professionalId, locationId, time: "" });
          }} disabled={!formState.serviceId}><option value="">{formState.serviceId ? "Selecciona profesional" : "Selecciona un servicio primero"}</option>{compatibleProfessionals.map((professional) => <option key={professional.id} value={professional.id}>{professional.displayName}{professional.roleTitle ? ` - ${professional.roleTitle}` : ""}</option>)}</select></label>
          {compatibleLocations.length === 1 && selectedLocation
            ? <div className="admin-field-summary"><span>Ubicaci&oacute;n</span><strong>{selectedLocation.name}</strong><small>Asignada al profesional seleccionado</small></div>
            :
          <label>Ubicación<select value={formState.locationId} onChange={(event) => onChange({ locationId: event.target.value, time: "" })} disabled={isAvailabilityPending || !formState.professionalId || compatibleLocations.length === 0}><option value="">{isAvailabilityPending ? "Consultando disponibilidad…" : "Selecciona ubicación"}</option>{compatibleLocations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
          }
        </div>
        {isAvailabilityPending
          ? <div className="admin-inline-loading" aria-live="polite" aria-busy="true"><span className="admin-skeleton admin-skeleton--line"/>Preparando horarios disponibles…</div>
          : availabilityState?.status === "error"
            ? <div className="admin-message admin-message--error"><span><strong>No pudimos cargar los horarios</strong>{availabilityState.message}</span><button className="button button--ghost" type="button" onClick={() => {
              if (formState.professionalId) {
                availabilityCache.current.delete(formState.professionalId);
              }
              setAvailabilityRetry((current) => current + 1);
            }}>Reintentar</button></div>
            : null}
        <div className="admin-form-section">
          <label>Fecha de la cita<input type="date" min={todayDate} value={formState.date} onChange={(event) => onChange({ date: event.target.value, time: "" })}/></label>
          <div>
            <div className="admin-form-section__header">
              <div>
                <strong>Hora de inicio</strong>
                <small>Horarios disponibles para el profesional, ubicación y día seleccionados.</small>
              </div>
            </div>
            {!formState.serviceId || !formState.professionalId || !formState.locationId || !formState.date
              ? <Notice title="Selecciona los datos primero" message="Elige servicio, profesional y ubicación para ver horarios disponibles." mode="info"/>
              : isAvailabilityPending
                ? <div className="admin-slot-grid admin-slot-grid--loading" aria-hidden="true">{Array.from({ length: 8 }, (_, index) => <span className="admin-skeleton admin-skeleton--slot" key={index}/>)}</div>
                : availabilityState?.status !== "ready"
                  ? <Notice title="Horarios pendientes" message="Completa los datos y vuelve a intentar si no aparecen horarios." mode="info"/>
                  : timeOptions.length === 0 || !hasAvailableTimes
                    ? <Notice title="Sin horarios disponibles" message="No hay horarios disponibles para esta fecha. Prueba con otro día u otro profesional." mode="warning"/>
                    : <TimeSlotGrid options={timeOptions} selectedTime={formState.time} onSelect={(time) => onChange({ time })}/>}
          </div>
        </div>
        <div className="admin-message admin-message--info" style={{ marginTop: 18 }}>
          <span>
            <strong>Resumen</strong>
            {selectedService ? `${selectedService.name} - ${formatDuration(selectedService.durationMinutes)} - ${formatClp(selectedService.priceFrom)}` : "Selecciona un servicio."}
            {selectedProfessional ? ` Profesional: ${selectedProfessional.displayName}.` : ""}
            {selectedLocation ? ` Ubicación: ${selectedLocation.name}.` : ""}
            {formState.time ? ` Hora: ${formState.time}.` : ""}
          </span>
        </div>
        <div className="admin-message admin-message--info" style={{ marginTop: 12 }}>
          <span><strong>Recomendación</strong>Te recomendamos llegar 5 minutos antes.</span>
        </div>
        {formState.serviceId && compatibleProfessionals.length === 0
          ? <Notice title="Sin profesionales disponibles" message="No hay profesionales activos con una ubicación asignada para este servicio." mode="warning"/>
          : null}
        {formState.professionalId && compatibleLocations.length === 0
          ? <Notice title="Sin ubicaciones disponibles" message="El profesional seleccionado no tiene ubicaciones activas." mode="warning"/>
          : null}
        {errorMessage
          ? <Notice title="No se pudo crear la cita" message={errorMessage} mode="error"/>
          : null}
        <div className="admin-dialog__footer">
          <div className="admin-action-row" style={{ marginTop: 0 }}>
            <button className="button button--ghost" type="button" onClick={onClose} disabled={isPending}>Cerrar</button>
            <button className="button" type="submit" disabled={isPending || !formState.time}>{isPending ? "Creando..." : "Crear cita"}</button>
          </div>
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
  return <div className="admin-slot-grid">
    {options.map((option) => <button
      key={option.time}
      className={`admin-slot ${selectedTime === option.time ? "is-selected" : ""}`}
      type="button"
      aria-pressed={selectedTime === option.time}
      disabled={!option.isAvailable}
      onClick={() => onSelect(option.time)}
      title={option.reason}
    >
      <strong>{option.time}</strong>
      <small>{option.isAvailable ? "Disponible" : option.reason}</small>
    </button>)}
  </div>;
}

function AppointmentDialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return <div className="admin-dialog-overlay" role="presentation">
    <section className="admin-panel admin-dialog" role="dialog" aria-modal="true" aria-label={title}>
      <div className="admin-dialog__header"><div><h2>{title}</h2><p>Completa los datos para crear la cita.</p></div><button className="button button--ghost" type="button" onClick={onClose}>Cerrar</button></div>
      <div className="admin-dialog__body">{children}</div>
    </section>
  </div>;
}

function Notice({ title, message, mode = "info" }: { title: string; message: string; mode?: "info" | "warning" | "error" }) {
  return <div className={`admin-message admin-message--${mode}`} style={{ marginTop: 14 }}><span><strong>{title}</strong>{message}</span></div>;
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
    return "No hay clientes disponibles para crear una cita.";
  }

  if (data.services.length === 0) {
    return "No hay servicios activos para crear una cita.";
  }

  if (data.professionals.length === 0) {
    return "No hay profesionales activos para crear una cita.";
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

function isCompatibilityError(code: string) {
  return new Set([
    "LOCATION_NOT_FOUND",
    "PROFESSIONAL_NOT_FOUND",
    "PROFESSIONAL_SERVICE_NOT_AVAILABLE",
    "PROFESSIONAL_SERVICE_NOT_ALLOWED",
    "APPOINTMENT_OUTSIDE_PROFESSIONAL_AVAILABILITY",
  ]).has(code);
}
