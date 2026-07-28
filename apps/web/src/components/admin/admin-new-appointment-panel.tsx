"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  createAdminAppointmentAction,
  loadAdminAppointmentAvailabilityAction,
  loadAdminAppointmentFormAction,
} from "@/app/admin/citas/actions";
import { operationalDisplayName } from "@/lib/admin-display";
import { formatClp, formatDuration } from "@/lib/formatting";
import type {
  AdminAppointmentAvailabilityLoadState,
  AdminAppointmentFormData,
  AdminAppointmentFormLoadState,
  AdminAppointmentServiceOption,
} from "@/types/admin-appointment-form";

interface FormState {
  customerId: string;
  serviceIds: string[];
  professionalId: string;
  locationId: string;
  date: string;
  time: string;
}

interface TimeOption {
  time: string;
}

const TIME_ZONE = "America/Santiago";
const SLOT_STEP_MINUTES = 15;
const initialFormState = (): FormState => ({
  customerId: "",
  serviceIds: [],
  professionalId: "",
  locationId: "",
  date: todayInSantiago(),
  time: "",
});
const weekdayByShortLabel: Record<string, Weekday> = {
  Mon: "MONDAY",
  Tue: "TUESDAY",
  Wed: "WEDNESDAY",
  Thu: "THURSDAY",
  Fri: "FRIDAY",
  Sat: "SATURDAY",
  Sun: "SUNDAY",
};

type Weekday = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";

export function AdminNewAppointmentPanel({ businessSlug }: { businessSlug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const opensFromQuery = searchParams.get("nueva") === "1";
  const [isOpen, setIsOpen] = useState(opensFromQuery);
  const [form, setForm] = useState<AdminAppointmentFormLoadState | null>(null);
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [toast, setToast] = useState<string | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [isCreating, startCreateTransition] = useTransition();
  const [isLoadingForm, startFormTransition] = useTransition();

  const loadForm = useCallback(() => {
    startFormTransition(async () => {
      setDialogError(null);
      setForm(await loadAdminAppointmentFormAction(businessSlug));
    });
  }, [businessSlug]);

  const openPanel = useCallback(() => {
    setDialogError(null);
    setIsOpen(true);
    if (!form) {
      loadForm();
    }
  }, [form, loadForm]);
  const closePanel = useCallback(() => {
    setDialogError(null);
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!opensFromQuery || form) {
      return;
    }
    let cancelled = false;
    void loadAdminAppointmentFormAction(businessSlug).then((result) => {
      if (!cancelled) {
        setForm(result);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [businessSlug, form, opensFromQuery]);

  return <div>
    <button className="button" type="button" onClick={openPanel}>Nueva cita</button>
    {toast && <div className="admin-toast" role="status">{toast}</div>}
    {isOpen && (!form || isLoadingForm
      ? <AppointmentDialog title="Nueva cita" onClose={closePanel}>
          <AppointmentLoading/>
        </AppointmentDialog>
      : form.status !== "ready"
        ? <AppointmentDialog title="Nueva cita" onClose={closePanel}>
            <Notice title="No pudimos preparar la cita" message={form.message} mode="error"/>
            <div className="admin-action-row admin-dialog-retry">
              <button className="button button--ghost" type="button" onClick={closePanel}>Cerrar</button>
              <button className="button" type="button" onClick={loadForm}>Reintentar</button>
            </div>
          </AppointmentDialog>
        : <AppointmentForm
            data={form.data}
            errorMessage={dialogError}
            formState={formState}
            isPending={isCreating}
            onChange={(next) => {
              setFormState(next);
              setDialogError(null);
              setToast(null);
            }}
            onClose={closePanel}
            onSubmit={(validationError) => {
              if (validationError) {
                setDialogError(validationError);
                return;
              }

              startCreateTransition(async () => {
                setDialogError(null);
                const result = await createAdminAppointmentAction({
                  businessSlug: form.data.businessSlug,
                  ...formState,
                });
                if (result.ok) {
                  setToast("Cita creada correctamente");
                  setFormState(initialFormState());
                  setIsOpen(false);
                  const query = new URLSearchParams(searchParams.toString());
                  query.delete("nueva");
                  query.set("negocio", businessSlug);
                  if (result.appointmentId) {
                    query.set("cita", result.appointmentId);
                  }
                  router.replace(`/admin/citas?${query.toString()}`);
                  router.refresh();
                  return;
                }

                if (result.code === "APPOINTMENT_SLOT_ALREADY_TAKEN"
                  || result.code === "APPOINTMENT_CUSTOMER_OVERLAP") {
                  setFormState((current) => ({ ...current, time: "" }));
                }
                if (isCompatibilityError(result.code)) {
                  setFormState((current) => ({
                    ...current,
                    professionalId: "",
                    locationId: "",
                    time: "",
                  }));
                  setForm(null);
                  loadForm();
                }
                setDialogError(result.message);
              });
            }}
          />)}
  </div>;
}

function AppointmentForm({
  data,
  errorMessage,
  formState,
  isPending,
  onChange,
  onClose,
  onSubmit,
}: {
  data: AdminAppointmentFormData;
  errorMessage: string | null;
  formState: FormState;
  isPending: boolean;
  onChange: (state: FormState) => void;
  onClose: () => void;
  onSubmit: (error?: string) => void;
}) {
  const availabilityRequestId = useRef(0);
  const availabilityCache = useRef(new Map<string, AdminAppointmentAvailabilityLoadState>());
  const availabilityRequests = useRef(new Map<string, Promise<AdminAppointmentAvailabilityLoadState>>());
  const [availabilityResult, setAvailabilityResult] = useState<{
    key: string;
    state: AdminAppointmentAvailabilityLoadState;
  } | null>(null);
  const [availabilityRetry, setAvailabilityRetry] = useState(0);
  const [isAvailabilityPending, startAvailabilityTransition] = useTransition();
  const selectedServices = useMemo(
    () => formState.serviceIds.flatMap((serviceId) => {
      const service = data.services.find((item) => item.id === serviceId);
      return service ? [service] : [];
    }),
    [data.services, formState.serviceIds],
  );
  const totalDuration = selectedServices.reduce((total, service) => total + service.durationMinutes, 0);
  const totalPrice = selectedServices.reduce((total, service) => total + service.priceFrom, 0);
  const compatibleProfessionals = useMemo(
    () => formState.serviceIds.length === 0
      ? []
      : data.professionals.filter((professional) =>
        professional.locations.length > 0
        && formState.serviceIds.every((serviceId) =>
          professional.services.some((service) => service.id === serviceId),
        ),
      ),
    [data.professionals, formState.serviceIds],
  );
  const selectedProfessional = compatibleProfessionals.find(
    (professional) => professional.id === formState.professionalId,
  );
  const compatibleLocations = useMemo(
    () => selectedProfessional?.locations ?? [],
    [selectedProfessional],
  );
  const selectedLocation = compatibleLocations.find((location) => location.id === formState.locationId);
  const availabilityKey = [
    formState.professionalId,
    formState.locationId,
    formState.date,
  ].join(":");
  const availabilityState = availabilityResult?.key === availabilityKey
    ? availabilityResult.state
    : null;
  const timeOptions = useMemo(
    () => availabilityState?.status === "ready"
      ? buildTimeOptions(availabilityState.data.availability, formState, totalDuration)
      : [],
    [availabilityState, formState, totalDuration],
  );
  const selectedEndTime = formState.time
    ? addMinutesToTime(formState.time, totalDuration)
    : "";
  const disabledReason = getDisabledReason(data);
  const canLoadAvailability = Boolean(
    formState.serviceIds.length > 0
    && selectedProfessional
    && selectedLocation
    && /^\d{4}-\d{2}-\d{2}$/.test(formState.date)
    && formState.date >= todayInSantiago(),
  );

  useEffect(() => {
    const requestId = availabilityRequestId.current + 1;
    availabilityRequestId.current = requestId;
    if (!canLoadAvailability || !selectedProfessional || !selectedLocation) {
      return;
    }

    const cached = availabilityCache.current.get(availabilityKey);
    if (cached) {
      startAvailabilityTransition(async () => {
        await Promise.resolve();
        if (availabilityRequestId.current === requestId) {
          setAvailabilityResult({ key: availabilityKey, state: cached });
        }
      });
      return;
    }

    let request = availabilityRequests.current.get(availabilityKey);
    if (!request) {
      request = loadAdminAppointmentAvailabilityAction({
        businessSlug: data.businessSlug,
        professionalId: selectedProfessional.id,
        locationId: selectedLocation.id,
        date: formState.date,
      }).catch(() => ({ status: "error" as const, message: "No pudimos cargar los horarios. Intenta nuevamente." }));
      availabilityRequests.current.set(availabilityKey, request);
    }

    startAvailabilityTransition(async () => {
      const result = await request;
      availabilityRequests.current.delete(availabilityKey);
      availabilityCache.current.set(availabilityKey, result);
      if (availabilityRequestId.current === requestId) {
        setAvailabilityResult({ key: availabilityKey, state: result });
      }
    });
  }, [
    availabilityKey,
    availabilityRetry,
    canLoadAvailability,
    data.businessSlug,
    formState.date,
    selectedLocation,
    selectedProfessional,
  ]);

  const toggleService = (service: AdminAppointmentServiceOption) => {
    const isSelected = formState.serviceIds.includes(service.id);
    const serviceIds = isSelected
      ? formState.serviceIds.filter((serviceId) => serviceId !== service.id)
      : [...formState.serviceIds, service.id];
    const professionalRemainsCompatible = Boolean(
      formState.professionalId
      && data.professionals.find((professional) =>
        professional.id === formState.professionalId
        && serviceIds.length > 0
        && serviceIds.every((serviceId) =>
          professional.services.some((assigned) => assigned.id === serviceId),
        ),
      ),
    );
    onChange({
      ...formState,
      serviceIds,
      professionalId: professionalRemainsCompatible ? formState.professionalId : "",
      locationId: professionalRemainsCompatible ? formState.locationId : "",
      time: "",
    });
  };

  return <AppointmentDialog title="Nueva cita" onClose={onClose}>
    {disabledReason
      ? <Notice title="Faltan datos para crear citas" message={disabledReason} mode="warning"/>
      : <form className="admin-appointment-flow" onSubmit={(event) => {
          event.preventDefault();
          onSubmit(validateForm(data, formState, timeOptions));
        }}>
          <div className="admin-appointment-steps">
            <section className="admin-step-section">
              <StepHeading number="1" title="Cliente" detail="Selecciona quién recibirá la atención."/>
              <label className="admin-field-label">Cliente
                <select value={formState.customerId} onChange={(event) => onChange({ ...formState, customerId: event.target.value })}>
                  <option value="">Selecciona un cliente</option>
                  {data.customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.fullName} · {customer.phone}</option>)}
                </select>
              </label>
            </section>

            <section className="admin-step-section">
              <StepHeading number="2" title="Servicios" detail="Puedes combinar uno o más servicios."/>
              <div className="admin-service-selector">
                {data.services.map((service) => {
                  const position = formState.serviceIds.indexOf(service.id);
                  return <button
                    className={position >= 0 ? "is-selected" : ""}
                    type="button"
                    aria-pressed={position >= 0}
                    key={service.id}
                    onClick={() => toggleService(service)}
                  >
                    {position >= 0 && <b>{position + 1}</b>}
                    <span><strong>{service.name}</strong><small>{formatDuration(service.durationMinutes)} · {formatClp(service.priceFrom)}</small></span>
                    <i aria-hidden="true">{position >= 0 ? "✓" : "+"}</i>
                  </button>;
                })}
              </div>
            </section>

            <section className="admin-step-section">
              <StepHeading number="3" title="Profesional" detail="Sólo mostramos profesionales compatibles con todos los servicios."/>
              {formState.serviceIds.length === 0
                ? <InlineHint text="Selecciona al menos un servicio para continuar."/>
                : compatibleProfessionals.length === 0
                  ? <Notice title="Sin profesionales compatibles" message="Ningún profesional activo realiza todos los servicios seleccionados." mode="warning"/>
                  : <div className="admin-professional-selector">
                      {compatibleProfessionals.map((professional) => <button
                        className={professional.id === formState.professionalId ? "is-selected" : ""}
                        type="button"
                        aria-pressed={professional.id === formState.professionalId}
                        key={professional.id}
                        onClick={() => onChange({
                          ...formState,
                          professionalId: professional.id,
                          locationId: professional.locations.length === 1 ? professional.locations[0].id : "",
                          time: "",
                        })}
                      ><span>{initials(professional.displayName)}</span><strong>{professional.displayName}</strong><small>{professional.roleTitle ?? "Profesional"}</small></button>)}
                    </div>}
            </section>

            {selectedProfessional && <section className="admin-step-section">
              <StepHeading number="4" title="Sucursal" detail={compatibleLocations.length === 1 ? "Asignada automáticamente." : "Selecciona una sucursal compatible."}/>
              {compatibleLocations.length === 1
                ? <div className="admin-auto-selection"><span>✓</span><div><strong>{operationalDisplayName(compatibleLocations[0].name)}</strong><small>Sucursal disponible para esta atención</small></div></div>
                : <label className="admin-field-label">Sucursal
                    <select value={formState.locationId} onChange={(event) => onChange({ ...formState, locationId: event.target.value, time: "" })}>
                      <option value="">Selecciona una sucursal</option>
                      {compatibleLocations.map((location) => <option value={location.id} key={location.id}>{operationalDisplayName(location.name)}</option>)}
                    </select>
                  </label>}
            </section>}

            <section className="admin-step-section">
              <StepHeading number="5" title="Fecha y hora" detail="Mostramos sólo horarios donde cabe la atención completa."/>
              <label className="admin-field-label">Fecha
                <input type="date" min={todayInSantiago()} value={formState.date} onChange={(event) => onChange({ ...formState, date: event.target.value, time: "" })}/>
              </label>
              {!canLoadAvailability
                ? <InlineHint text="Completa servicios, profesional, sucursal y fecha para ver horarios."/>
                : isAvailabilityPending
                  ? <div className="admin-slot-grid" aria-label="Preparando horarios" aria-busy="true">{Array.from({ length: 8 }, (_, index) => <span className="admin-skeleton admin-skeleton--slot" key={index}/>)}</div>
                  : availabilityState?.status === "error"
                    ? <div className="admin-message admin-message--error"><span><strong>No pudimos cargar los horarios</strong>{availabilityState.message}</span><button className="button button--ghost" type="button" onClick={() => {
                        availabilityCache.current.delete(availabilityKey);
                        setAvailabilityRetry((current) => current + 1);
                      }}>Reintentar</button></div>
                    : timeOptions.length === 0
                      ? <Notice title="Sin horarios disponibles" message="Prueba con otra fecha o profesional." mode="warning"/>
                      : <div className="admin-slot-grid">{timeOptions.map((option) => <button
                          type="button"
                          className={`admin-slot ${formState.time === option.time ? "is-selected" : ""}`}
                          aria-pressed={formState.time === option.time}
                          key={option.time}
                          onClick={() => onChange({ ...formState, time: option.time })}
                        ><strong>{option.time}</strong><small>Disponible</small></button>)}</div>}
            </section>
          </div>

          <aside className="admin-appointment-summary">
            <div><span className="eyebrow">Resumen</span><h3>Tu nueva cita</h3></div>
            <SummaryRow label="Cliente" value={data.customers.find((customer) => customer.id === formState.customerId)?.fullName ?? "Por seleccionar"}/>
            <SummaryRow label="Servicios" value={selectedServices.length ? selectedServices.map((service) => service.name).join(" + ") : "Por seleccionar"}/>
            <SummaryRow label="Profesional" value={selectedProfessional?.displayName ?? "Por seleccionar"}/>
            <SummaryRow label="Inicio" value={formState.time ? `${formatDateLabel(formState.date)} · ${formState.time}` : "Por seleccionar"}/>
            <SummaryRow label="Término estimado" value={selectedEndTime || "Por calcular"}/>
            <div className="admin-summary-total"><span><small>Duración total</small><strong>{totalDuration ? formatDuration(totalDuration) : "—"}</strong></span><span><small>Total</small><strong>{formatClp(totalPrice)}</strong></span></div>
            {errorMessage && <Notice title="No se pudo crear la cita" message={errorMessage} mode="error"/>}
            <div className="admin-summary-actions">
              <button className="button button--ghost" type="button" onClick={onClose} disabled={isPending}>Cerrar</button>
              <button className="button" type="submit" disabled={isPending || !formState.time}>{isPending ? "Creando…" : "Crear cita"}</button>
            </div>
          </aside>
        </form>}
  </AppointmentDialog>;
}

function AppointmentDialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )].filter((element) => element.offsetParent !== null);
      if (focusable.length === 0) {
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return <div className="admin-dialog-overlay">
    <button className="admin-dialog-backdrop" type="button" aria-label="Cerrar Nueva cita" onClick={onClose}/>
    <section ref={dialogRef} className="admin-panel admin-dialog admin-appointment-dialog" role="dialog" aria-modal="true" aria-labelledby="new-appointment-title">
      <div className="admin-dialog__header">
        <div><span className="eyebrow">Agenda</span><h2 id="new-appointment-title">{title}</h2><p>Crea una atención compatible, paso a paso.</p></div>
        <button ref={closeRef} className="admin-icon-button is-visible" type="button" aria-label="Cerrar Nueva cita" onClick={onClose}>×</button>
      </div>
      <div className="admin-dialog__body">{children}</div>
    </section>
  </div>;
}

function AppointmentLoading() {
  return <div className="admin-dialog-loading" aria-live="polite" aria-busy="true">
    <div className="admin-skeleton admin-skeleton--line admin-skeleton--wide"/>
    <div className="admin-skeleton-grid"><div/><div/><div/><div/></div>
    <p>Preparando datos de la cita…</p>
  </div>;
}

function StepHeading({ number, title, detail }: { number: string; title: string; detail: string }) {
  return <div className="admin-step-heading"><b>{number}</b><span><strong>{title}</strong><small>{detail}</small></span></div>;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return <div className="admin-summary-row"><small>{label}</small><strong>{value}</strong></div>;
}

function InlineHint({ text }: { text: string }) {
  return <div className="admin-inline-hint">{text}</div>;
}

function Notice({ title, message, mode = "info" }: { title: string; message: string; mode?: "info" | "warning" | "error" }) {
  return <div className={`admin-message admin-message--${mode}`}><span><strong>{title}</strong>{message}</span></div>;
}

function validateForm(data: AdminAppointmentFormData, state: FormState, options: TimeOption[]) {
  if (!state.customerId || state.serviceIds.length === 0 || !state.professionalId || !state.locationId || !state.date || !state.time) {
    return "Completa todos los pasos antes de crear la cita.";
  }
  if (new Set(state.serviceIds).size !== state.serviceIds.length) {
    return "No puedes seleccionar el mismo servicio más de una vez.";
  }
  const professional = data.professionals.find((item) => item.id === state.professionalId);
  if (!professional || !state.serviceIds.every((serviceId) => professional.services.some((service) => service.id === serviceId))) {
    return "El profesional no es compatible con todos los servicios seleccionados.";
  }
  if (!professional.locations.some((location) => location.id === state.locationId)) {
    return "Selecciona una sucursal compatible.";
  }
  if (!options.some((option) => option.time === state.time)) {
    return "Selecciona un horario disponible.";
  }
  return undefined;
}

function buildTimeOptions(
  availability: AdminAppointmentFormData["availabilityByProfessionalId"][string],
  state: FormState,
  durationMinutes: number,
): TimeOption[] {
  if (!state.date || !state.locationId || durationMinutes <= 0) {
    return [];
  }
  const weekday = getWeekday(state.date);
  const businessHours = availability.businessHours.filter(
    (rule) => rule.weekday === weekday && (rule.locationId === null || rule.locationId === state.locationId),
  );
  const professionalHours = availability.weeklyRules.filter(
    (rule) => rule.weekday === weekday && rule.locationId === state.locationId,
  );
  const intervals = intersectIntervals(
    businessHours.map((rule) => [timeToMinutes(rule.opensAtLocal), timeToMinutes(rule.closesAtLocal)]),
    professionalHours.map((rule) => [timeToMinutes(rule.startsAtLocal), timeToMinutes(rule.endsAtLocal)]),
  );
  const now = getSantiagoParts(new Date());
  const options: TimeOption[] = [];
  for (const [start, end] of intervals) {
    for (let minute = start; minute + durationMinutes <= end; minute += SLOT_STEP_MINUTES) {
      if (state.date === now.date && minute <= now.minutes) {
        continue;
      }
      const slotEnd = minute + durationMinutes;
      if (availability.timeOff.some((entry) => intervalOverlaps(entry.startsAt, entry.endsAt, state.date, minute, slotEnd, entry.locationId, state.locationId))) {
        continue;
      }
      if (availability.bookedIntervals.some((entry) => intervalOverlaps(entry.startsAt, entry.endsAt, state.date, minute, slotEnd, state.locationId, state.locationId))) {
        continue;
      }
      options.push({ time: minutesToTime(minute) });
    }
  }
  return [...new Map(options.map((option) => [option.time, option])).values()];
}

function intervalOverlaps(
  startsAt: string,
  endsAt: string,
  date: string,
  slotStart: number,
  slotEnd: number,
  intervalLocationId: string | null,
  locationId: string,
) {
  if (intervalLocationId && intervalLocationId !== locationId) {
    return false;
  }
  const start = getSantiagoParts(new Date(startsAt));
  const end = getSantiagoParts(new Date(endsAt));
  if (date < start.date || date > end.date) {
    return false;
  }
  const blockedStart = date === start.date ? start.minutes : 0;
  const blockedEnd = date === end.date ? end.minutes : 24 * 60;
  return slotStart < blockedEnd && slotEnd > blockedStart;
}

function intersectIntervals(base: number[][], overlay: number[][]) {
  const result: number[][] = [];
  base.forEach(([baseStart, baseEnd]) => overlay.forEach(([overlayStart, overlayEnd]) => {
    const start = Math.max(baseStart, overlayStart);
    const end = Math.min(baseEnd, overlayEnd);
    if (start < end) {
      result.push([start, end]);
    }
  }));
  return result;
}

function getDisabledReason(data: AdminAppointmentFormData) {
  if (data.customers.length === 0) return "No hay clientes disponibles.";
  if (data.services.length === 0) return "No hay servicios activos.";
  if (data.professionals.length === 0) return "No hay profesionales activos.";
  return undefined;
}

function getWeekday(date: string): Weekday {
  const [year, month, day] = date.split("-").map(Number);
  const label = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, weekday: "short" })
    .format(new Date(Date.UTC(year, month - 1, day, 12)));
  return weekdayByShortLabel[label] ?? "MONDAY";
}

function getSantiagoParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    date: `${value.year}-${value.month}-${value.day}`,
    minutes: Number(value.hour) * 60 + Number(value.minute),
  };
}

function todayInSantiago() {
  return getSantiagoParts(new Date()).date;
}

function timeToMinutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function minutesToTime(value: number) {
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

function addMinutesToTime(time: string, duration: number) {
  return minutesToTime(timeToMinutes(time) + duration);
}

function formatDateLabel(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short" })
    .format(new Date(Date.UTC(year, month - 1, day, 12)));
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
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
