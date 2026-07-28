"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { updateAdminAppointmentStatusAction } from "@/app/admin/citas/actions";
import { Icon } from "@/components/ui/icon";
import { operationalDisplayName } from "@/lib/admin-display";
import { formatClp, formatDuration } from "@/lib/formatting";
import type {
  AdminAppointmentTargetStatus,
  AdminCalendarAppointment,
  AdminCalendarLoadState,
  AdminCalendarResponse,
  AdminCalendarStatus,
} from "@/types/admin-calendar";

const statusLabel: Record<AdminCalendarStatus, string> = {
  CONFIRMED: "Confirmada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_SHOW: "No asistió",
};

export function AdminCalendarPanel({
  calendar,
  businessSlug,
  initialAppointmentId,
}: {
  calendar?: AdminCalendarLoadState;
  businessSlug: string;
  initialAppointmentId?: string;
}) {
  if (!calendar || calendar.status !== "ready") {
    return <section className="admin-panel admin-empty-state"><div>
      <Icon name="calendar"/>
      <h2>No pudimos cargar la agenda</h2>
      <p>{calendar?.message ?? "Intenta nuevamente en unos minutos."}</p>
    </div></section>;
  }

  return <ReadyCalendar
    businessSlug={businessSlug}
    initialAppointmentId={initialAppointmentId}
    initialData={calendar.data}
  />;
}

function ReadyCalendar({
  businessSlug,
  initialAppointmentId,
  initialData,
}: {
  businessSlug: string;
  initialAppointmentId?: string;
  initialData: AdminCalendarResponse;
}) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [query, setQuery] = useState("");
  const [professionalId, setProfessionalId] = useState("");
  const [status, setStatus] = useState<AdminCalendarStatus | "">("");
  const [selectedId, setSelectedId] = useState(initialAppointmentId ?? "");
  const [confirmTarget, setConfirmTarget] = useState<AdminAppointmentTargetStatus | null>(null);
  const [feedback, setFeedback] = useState<{ mode: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const appointmentOpenerRef = useRef<HTMLButtonElement | null>(null);
  const selected = data.appointments.find((appointment) => appointment.id === selectedId);
  const professionals = useMemo(() => {
    const byId = new Map<string, { id: string; displayName: string }>();
    data.appointments.forEach((appointment) =>
      appointment.professionals.forEach((professional) => byId.set(professional.id, professional)),
    );
    return [...byId.values()].sort((left, right) => left.displayName.localeCompare(right.displayName, "es"));
  }, [data.appointments]);
  const filteredAppointments = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("es-CL");
    return data.appointments.filter((appointment) =>
      (!status || appointment.status === status)
      && (!professionalId || appointment.professionals.some((professional) => professional.id === professionalId))
      && (!normalizedQuery
        || appointment.customer.fullName.toLocaleLowerCase("es-CL").includes(normalizedQuery)
        || appointment.customer.phone.replace(/\s/g, "").includes(normalizedQuery.replace(/\s/g, ""))),
    );
  }, [data.appointments, professionalId, query, status]);

  const changeStatus = (target: AdminAppointmentTargetStatus) => {
    if (!selected) {
      return;
    }
    startTransition(async () => {
      setFeedback(null);
      const result = await updateAdminAppointmentStatusAction({
        businessSlug,
        appointmentId: selected.id,
        status: target,
      });
      if (!result.ok) {
        setFeedback({ mode: "error", text: result.message });
        return;
      }

      setData((current) => replaceAppointment(current, result.appointment));
      setConfirmTarget(null);
      setFeedback({ mode: "success", text: statusSuccessMessage(target) });
      router.refresh();
    });
  };
  const closeDetail = useCallback(() => {
    setSelectedId("");
    setConfirmTarget(null);
    setFeedback(null);
    requestAnimationFrame(() => appointmentOpenerRef.current?.focus());
  }, []);

  return <>
    <div className="metric-grid admin-agenda-metrics">
      <Metric label="Total" value={data.summary.total} detail="Citas del período" icon="calendar"/>
      <Metric label="Confirmadas" value={data.summary.byStatus.CONFIRMED} detail="Atenciones vigentes" icon="clock"/>
      <Metric label="Completadas" value={data.summary.byStatus.COMPLETED} detail="Atenciones finalizadas" icon="chart"/>
      <Metric label="Canceladas / no asistió" value={data.summary.byStatus.CANCELLED + data.summary.byStatus.NO_SHOW} detail={`${data.summary.byStatus.CANCELLED} canceladas · ${data.summary.byStatus.NO_SHOW} no asistió`} icon="sparkles"/>
    </div>

    <section className="admin-panel admin-agenda-panel">
      <div className="panel-heading admin-agenda-heading">
        <div><h2>Lista de citas</h2><p>{formatRange(data.range.from, data.range.to)}</p></div>
        <span className="admin-view-label">Vista lista</span>
      </div>
      <div className="admin-agenda-filters">
        <label className="admin-search-field">
          <span>Buscar</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cliente o teléfono"/>
        </label>
        <label>
          <span>Profesional</span>
          <select value={professionalId} onChange={(event) => setProfessionalId(event.target.value)}>
            <option value="">Todo el equipo</option>
            {professionals.map((professional) => <option value={professional.id} key={professional.id}>{professional.displayName}</option>)}
          </select>
        </label>
        <label>
          <span>Estado</span>
          <select value={status} onChange={(event) => setStatus(event.target.value as AdminCalendarStatus | "")}>
            <option value="">Todos los estados</option>
            {Object.entries(statusLabel).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
        </label>
      </div>

      {filteredAppointments.length === 0
        ? <div className="admin-empty-state admin-empty-state--compact"><div><Icon name="calendar"/><h3>No encontramos citas</h3><p>Ajusta los filtros o crea una nueva cita.</p></div></div>
        : <div className="admin-appointment-list">
            {filteredAppointments.map((appointment) => <button
              type="button"
              key={appointment.id}
              onClick={(event) => {
                appointmentOpenerRef.current = event.currentTarget;
                setFeedback(null);
                setSelectedId(appointment.id);
              }}
            >
              <span className="admin-appointment-time"><strong>{formatTime(appointment.startAt)}</strong><small>{formatTime(appointment.endAt)}</small></span>
              <span className="admin-appointment-person"><strong>{appointment.customer.fullName || "Cliente sin nombre"}</strong><small>{appointment.customer.phone}</small></span>
              <span className="admin-appointment-service"><strong>{appointment.services.map((service) => service.name).join(" + ") || "Servicio sin detalle"}</strong><small>{formatDuration(appointment.totalDurationMinutes)} · {formatClp(appointment.totalPriceClp)}</small></span>
              <span className="admin-appointment-team"><strong>{appointment.professionals.map((professional) => professional.displayName).join(", ") || "Sin profesional"}</strong><small>{operationalDisplayName(appointment.location.name)}</small></span>
              <span className={`status status--${appointment.status.toLowerCase()}`}>{statusLabel[appointment.status]}</span>
              <span className="admin-appointment-chevron" aria-hidden="true">→</span>
            </button>)}
          </div>}
    </section>

    {selected && <AppointmentDetailDrawer
      appointment={selected}
      confirmTarget={confirmTarget}
      feedback={feedback}
      isPending={isPending}
      onClose={closeDetail}
      onRequestStatus={(target) => {
        if (target === "COMPLETED") {
          changeStatus(target);
        } else {
          setConfirmTarget(target);
        }
      }}
      onCancelConfirmation={() => setConfirmTarget(null)}
      onConfirmStatus={() => confirmTarget && changeStatus(confirmTarget)}
    />}
    {feedback?.mode === "success" && !selected && <div className="admin-toast" role="status">{feedback.text}</div>}
  </>;
}

function AppointmentDetailDrawer({
  appointment,
  confirmTarget,
  feedback,
  isPending,
  onClose,
  onRequestStatus,
  onCancelConfirmation,
  onConfirmStatus,
}: {
  appointment: AdminCalendarAppointment;
  confirmTarget: AdminAppointmentTargetStatus | null;
  feedback: { mode: "success" | "error"; text: string } | null;
  isPending: boolean;
  onClose: () => void;
  onRequestStatus: (target: AdminAppointmentTargetStatus) => void;
  onCancelConfirmation: () => void;
  onConfirmStatus: () => void;
}) {
  const drawerRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !drawerRef.current) {
        return;
      }
      const focusable = [...drawerRef.current.querySelectorAll<HTMLElement>(
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
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return <div className="admin-detail-layer">
    <button className="admin-detail-backdrop" type="button" aria-label="Cerrar detalle" onClick={onClose}/>
    <section ref={drawerRef} className="admin-detail-drawer" role="dialog" aria-modal="true" aria-labelledby="appointment-detail-title">
      <header>
        <div><span className="eyebrow">{formatDate(appointment.startAt)}</span><h2 id="appointment-detail-title">Detalle de la cita</h2></div>
        <button ref={closeRef} className="admin-icon-button is-visible" type="button" onClick={onClose} aria-label="Cerrar detalle">×</button>
      </header>
      <div className="admin-detail-body">
        <div className="admin-detail-hero">
          <div><strong>{formatTime(appointment.startAt)}–{formatTime(appointment.endAt)}</strong><span className={`status status--${appointment.status.toLowerCase()}`}>{statusLabel[appointment.status]}</span></div>
          <h3>{appointment.customer.fullName}</h3>
          <a href={`tel:${appointment.customer.phone}`}>{appointment.customer.phone}</a>
        </div>
        <dl className="admin-detail-list">
          <div><dt>Servicios</dt><dd>{appointment.services.map((service) => service.name).join(" + ")}</dd></div>
          <div><dt>Profesional</dt><dd>{appointment.professionals.map((professional) => professional.displayName).join(", ") || "Sin profesional"}</dd></div>
          <div><dt>Sucursal</dt><dd>{operationalDisplayName(appointment.location.name)}</dd></div>
          <div><dt>Duración</dt><dd>{formatDuration(appointment.totalDurationMinutes)}</dd></div>
          <div><dt>Total</dt><dd>{formatClp(appointment.totalPriceClp)}</dd></div>
        </dl>
        {feedback && <div className={`admin-message admin-message--${feedback.mode === "error" ? "error" : "info"}`} role="status"><span>{feedback.text}</span></div>}
        {confirmTarget && <div className="admin-confirm-card">
          <strong>{confirmTarget === "CANCELLED" ? "¿Cancelar esta cita?" : "¿Marcar como no asistió?"}</strong>
          <p>Esta acción actualizará la agenda inmediatamente.</p>
          <div className="admin-action-row">
            <button className="button button--ghost" type="button" onClick={onCancelConfirmation} disabled={isPending}>Volver</button>
            <button className="button button--danger" type="button" onClick={onConfirmStatus} disabled={isPending}>{isPending ? "Actualizando…" : "Confirmar"}</button>
          </div>
        </div>}
      </div>
      {appointment.status === "CONFIRMED" && !confirmTarget && <footer>
        <button className="button" type="button" onClick={() => onRequestStatus("COMPLETED")} disabled={isPending}>{isPending ? "Actualizando…" : "Completar"}</button>
        <button className="button button--ghost" type="button" onClick={() => onRequestStatus("NO_SHOW")} disabled={isPending}>No asistió</button>
        <button className="button button--danger-ghost" type="button" onClick={() => onRequestStatus("CANCELLED")} disabled={isPending}>Cancelar cita</button>
      </footer>}
    </section>
  </div>;
}

function Metric({ label, value, detail, icon }: { label: string; value: number; detail: string; icon: "calendar" | "clock" | "chart" | "sparkles" }) {
  return <article><span className="metric-icon"><Icon name={icon}/></span><small>{label}</small><strong>{value}</strong><em>{detail}</em></article>;
}

function replaceAppointment(data: AdminCalendarResponse, appointment: AdminCalendarAppointment): AdminCalendarResponse {
  const appointments = data.appointments.map((current) => current.id === appointment.id ? appointment : current);
  const byStatus: AdminCalendarResponse["summary"]["byStatus"] = {
    CONFIRMED: 0,
    COMPLETED: 0,
    CANCELLED: 0,
    NO_SHOW: 0,
  };
  appointments.forEach((current) => {
    byStatus[current.status] += 1;
  });
  return { ...data, appointments, summary: { total: appointments.length, byStatus } };
}

function statusSuccessMessage(status: AdminAppointmentTargetStatus) {
  return status === "COMPLETED"
    ? "Cita completada correctamente"
    : status === "CANCELLED"
      ? "Cita cancelada correctamente"
      : "Cita marcada como no asistió";
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("es-CL", {
    timeZone: "America/Santiago",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-CL", {
    timeZone: "America/Santiago",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(value));
}

function formatRange(from: string, to: string) {
  const formatter = new Intl.DateTimeFormat("es-CL", {
    timeZone: "America/Santiago",
    day: "numeric",
    month: "short",
  });
  return `${formatter.format(new Date(from))} al ${formatter.format(new Date(to))}`;
}
