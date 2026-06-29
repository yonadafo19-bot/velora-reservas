"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  updateBusinessHoursAction,
  updateProfessionalAvailabilityAction,
} from "@/app/admin/horarios/actions";
import type {
  AdminAvailabilityData,
  AdminAvailabilityLoadState,
  AdminAvailabilityStatus,
  AdminAvailabilityWeekday,
  AdminBusinessHourInput,
  AdminProfessionalAvailabilityRuleInput,
} from "@/lib/admin-availability-api";

interface DayRow {
  weekday: AdminAvailabilityWeekday;
  isActive: boolean;
  start: string;
  end: string;
}

const weekdays: Array<{ value: AdminAvailabilityWeekday; label: string }> = [
  { value: "MONDAY", label: "Lunes" },
  { value: "TUESDAY", label: "Martes" },
  { value: "WEDNESDAY", label: "Miercoles" },
  { value: "THURSDAY", label: "Jueves" },
  { value: "FRIDAY", label: "Viernes" },
  { value: "SATURDAY", label: "Sabado" },
  { value: "SUNDAY", label: "Domingo" },
];

const defaultStart = "09:00";
const defaultEnd = "18:00";

export function AdminAvailabilityPanel({ state }: { state: AdminAvailabilityLoadState }) {
  if (state.status === "MISSING_CONFIG") {
    return <AvailabilityStateNotice
      title="Horarios reales no disponibles"
      message={state.message}
      status="MISSING_CONFIG"
      mode="warning"
    />;
  }

  if (state.status === "API_ERROR") {
    return <AvailabilityStateNotice
      title="No pudimos cargar horarios"
      message={state.httpStatus ? `${state.message} Codigo HTTP: ${state.httpStatus}.` : state.message}
      status="API_ERROR"
      mode="error"
    />;
  }

  if (state.status === "NEEDS_PROFESSIONALS") {
    return <AvailabilityStateNotice
      title="Faltan profesionales activos"
      message={state.message}
      status="NEEDS_PROFESSIONALS"
      mode="warning"
    />;
  }

  return <ConnectedAvailabilityPanel
    data={state.data}
    needsLocationMessage={state.status === "NEEDS_LOCATION" ? state.message : null}
  />;
}

function ConnectedAvailabilityPanel({
  data,
  needsLocationMessage,
}: {
  data: AdminAvailabilityData;
  needsLocationMessage: string | null;
}) {
  const router = useRouter();
  const [businessRows, setBusinessRows] = useState<DayRow[]>(() => buildBusinessRows(data));
  const [selectedLocationId, setSelectedLocationId] = useState(data.selectedLocationId ?? "");
  const [professionalRows, setProfessionalRows] = useState<DayRow[]>(() => buildProfessionalRows(data, data.selectedLocationId ?? ""));
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const activeBusinessDays = businessRows.filter((row) => row.isActive).length;
  const activeProfessionalDays = professionalRows.filter((row) => row.isActive).length;

  function saveBusinessHours() {
    const hours = toBusinessHoursPayload(businessRows);
    const validationMessage = validateRows(businessRows);
    if (validationMessage) {
      setMessage({ type: "error", text: validationMessage });
      return;
    }

    startTransition(async () => {
      const result = await updateBusinessHoursAction({
        businessSlug: data.businessSlug,
        hours,
      });

      if (result.ok) {
        setMessage({ type: "success", text: "Horario de negocio actualizado correctamente." });
        router.refresh();
        return;
      }

      setMessage({ type: "error", text: result.message });
    });
  }

  function saveProfessionalAvailability() {
    if (!selectedLocationId) {
      setMessage({ type: "error", text: "Selecciona una sucursal activa para guardar disponibilidad." });
      return;
    }

    const validationMessage = validateRows(professionalRows);
    if (validationMessage) {
      setMessage({ type: "error", text: validationMessage });
      return;
    }

    startTransition(async () => {
      const result = await updateProfessionalAvailabilityAction({
        businessSlug: data.businessSlug,
        professionalId: data.selectedProfessionalId,
        rules: toProfessionalRulesPayload(professionalRows, selectedLocationId),
      });

      if (result.ok) {
        setMessage({ type: "success", text: "Disponibilidad del profesional actualizada correctamente." });
        router.refresh();
        return;
      }

      setMessage({ type: "error", text: result.message });
    });
  }

  return <div style={{ display: "grid", gap: 18 }}>
    <div className="metric-grid">
      <article><small>Profesionales activos</small><strong>{data.professionals.length}</strong><em>Fuente API real</em></article>
      <article><small>Sucursales activas</small><strong>{data.locations.length}</strong><em>{data.businessTimezone}</em></article>
      <article><small>Negocio</small><strong>{activeBusinessDays}</strong><em>Dias activos</em></article>
      <article><small>Profesional</small><strong>{activeProfessionalDays}</strong><em>Dias disponibles</em></article>
    </div>

    {needsLocationMessage && <div className="demo-notice" style={{ background: "#fff0d8" }}>
      <span><strong>NEEDS_LOCATION</strong>{needsLocationMessage}</span>
    </div>}

    <section className="admin-panel">
      <div className="panel-heading">
        <div>
          <h2>Horario de negocio</h2>
          <p>Horario semanal base en America/Santiago.</p>
        </div>
        <span className="status status--confirmed">REAL_CONNECTED</span>
      </div>
      <ScheduleEditor rows={businessRows} disabled={isPending} onChange={(nextRows) => {
        setBusinessRows(nextRows);
        setMessage(null);
      }}/>
      <div className="button-row" style={{ justifyContent: "flex-end", marginTop: 18 }}>
        <button className="button" type="button" onClick={saveBusinessHours} disabled={isPending}>Guardar horario negocio</button>
      </div>
    </section>

    <section className="admin-panel">
      <div className="panel-heading">
        <div>
          <h2>Disponibilidad profesional</h2>
          <p>Configura disponibilidad semanal por profesional y sucursal.</p>
        </div>
      </div>
      <div className="form-grid">
        <label>Profesional<select
          value={data.selectedProfessionalId}
          onChange={(event) => {
            router.push(`/admin/horarios?negocio=${businessFromSlug(data.businessSlug)}&professionalId=${event.target.value}`);
          }}
          disabled={isPending}
        >
          {data.professionals.map((professional) => <option key={professional.id} value={professional.id}>{professional.displayName}</option>)}
        </select></label>
        <label>Sucursal<select
          value={selectedLocationId}
          onChange={(event) => {
            const nextLocationId = event.target.value;
            setSelectedLocationId(nextLocationId);
            setProfessionalRows(buildProfessionalRows(data, nextLocationId));
            setMessage(null);
          }}
          disabled={isPending || data.locations.length === 0}
        >
          {data.locations.length === 0
            ? <option value="">Sin sucursales activas</option>
            : data.locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
        </select></label>
      </div>
      <ScheduleEditor rows={professionalRows} disabled={isPending || !selectedLocationId} onChange={(nextRows) => {
        setProfessionalRows(nextRows);
        setMessage(null);
      }}/>
      <div className="button-row" style={{ justifyContent: "flex-end", marginTop: 18 }}>
        <button className="button" type="button" onClick={saveProfessionalAvailability} disabled={isPending || !selectedLocationId}>Guardar disponibilidad profesional</button>
      </div>
    </section>

    <section className="admin-panel">
      <div className="panel-heading">
        <div>
          <h2>Bloqueos y excepciones</h2>
          <p>Vista solo lectura de timeOff activo entregado por API.</p>
        </div>
      </div>
      {data.timeOff.length === 0
        ? <div className="demo-notice"><span><strong>Sin bloqueos activos</strong>No hay timeOff futuro para este profesional o sus sucursales.</span></div>
        : <div className="admin-table">
          <div className="table-head"><span>Inicio</span><span>Fin</span><span>Sucursal</span><span>Estado</span></div>
          {data.timeOff.map((entry) => <div className="table-row" key={entry.id}>
            <span data-label="Inicio">{formatDateTime(entry.startsAt)}</span>
            <span data-label="Fin">{formatDateTime(entry.endsAt)}</span>
            <span data-label="Sucursal">{locationName(data, entry.locationId)}</span>
            <span data-label="Estado"><i className="status status--pending">{entry.status}</i></span>
          </div>)}
        </div>}
    </section>

    {message && <div className="demo-notice" style={{ background: message.type === "success" ? "#e5f1e9" : "#f5e7e6" }}>
      <span><strong>{message.type === "success" ? "Guardado" : "No se pudo guardar"}</strong>{message.text}</span>
    </div>}
  </div>;
}

function ScheduleEditor({
  rows,
  disabled,
  onChange,
}: {
  rows: DayRow[];
  disabled: boolean;
  onChange: (rows: DayRow[]) => void;
}) {
  return <div style={{ display: "grid", gap: 10 }}>
    {rows.map((row) => <div
      key={row.weekday}
      className="form-grid"
      style={{ alignItems: "end", borderBottom: "1px solid #ebe9e5", paddingBottom: 10 }}
    >
      <label style={{ alignItems: "center", display: "flex", flexDirection: "row", gap: 10 }}>
        <input
          type="checkbox"
          checked={row.isActive}
          disabled={disabled}
          onChange={(event) => onChange(updateRow(rows, row.weekday, { isActive: event.target.checked }))}
        />
        <span>{weekdayLabel(row.weekday)}</span>
      </label>
      <label>Inicio<input
        type="time"
        value={row.start}
        disabled={disabled || !row.isActive}
        onChange={(event) => onChange(updateRow(rows, row.weekday, { start: event.target.value }))}
      /></label>
      <label>Fin<input
        type="time"
        value={row.end}
        disabled={disabled || !row.isActive}
        onChange={(event) => onChange(updateRow(rows, row.weekday, { end: event.target.value }))}
      /></label>
    </div>)}
  </div>;
}

function AvailabilityStateNotice({
  title,
  message,
  status,
  mode,
}: {
  title: string;
  message: string;
  status: "MISSING_CONFIG" | "API_ERROR" | "NEEDS_PROFESSIONALS";
  mode: "warning" | "error";
}) {
  return <section className="admin-panel">
    <div className="panel-heading">
      <div>
        <h2>{title}</h2>
        <p>{message}</p>
      </div>
      <span className={`status ${mode === "warning" ? "status--pending" : "status--cancelled"}`}>{status}</span>
    </div>
    <div className="demo-notice">
      <span><strong>No se muestran datos demo</strong>Configura el API para operar con horarios reales persistentes.</span>
    </div>
  </section>;
}

function buildBusinessRows(data: AdminAvailabilityData): DayRow[] {
  return weekdays.map((weekday) => {
    const existing = data.businessHours.find((hour) => hour.weekday === weekday.value && hour.locationId === null)
      ?? data.businessHours.find((hour) => hour.weekday === weekday.value);

    return {
      weekday: weekday.value,
      isActive: existing?.status === "ACTIVE",
      start: existing?.opensAtLocal ?? defaultStart,
      end: existing?.closesAtLocal ?? defaultEnd,
    };
  });
}

function buildProfessionalRows(data: AdminAvailabilityData, locationId: string): DayRow[] {
  return weekdays.map((weekday) => {
    const existing = data.weeklyRules.find((rule) => rule.weekday === weekday.value && rule.locationId === locationId);

    return {
      weekday: weekday.value,
      isActive: existing?.status === "ACTIVE",
      start: existing?.startsAtLocal ?? defaultStart,
      end: existing?.endsAtLocal ?? defaultEnd,
    };
  });
}

function toBusinessHoursPayload(rows: DayRow[]): AdminBusinessHourInput[] {
  return rows.map((row) => ({
    locationId: null,
    weekday: row.weekday,
    opensAtLocal: row.start,
    closesAtLocal: row.end,
    status: statusFromRow(row),
  }));
}

function toProfessionalRulesPayload(rows: DayRow[], locationId: string): AdminProfessionalAvailabilityRuleInput[] {
  return rows.map((row) => ({
    locationId,
    weekday: row.weekday,
    startsAtLocal: row.start,
    endsAtLocal: row.end,
    status: statusFromRow(row),
  }));
}

function statusFromRow(row: DayRow): AdminAvailabilityStatus {
  return row.isActive ? "ACTIVE" : "INACTIVE";
}

function validateRows(rows: DayRow[]) {
  const invalid = rows.find((row) => row.isActive && toMinutes(row.start) >= toMinutes(row.end));
  return invalid ? `${weekdayLabel(invalid.weekday)} debe tener hora de inicio menor a hora de fin.` : null;
}

function updateRow(rows: DayRow[], weekday: AdminAvailabilityWeekday, patch: Partial<DayRow>) {
  return rows.map((row) => row.weekday === weekday ? { ...row, ...patch } : row);
}

function weekdayLabel(value: AdminAvailabilityWeekday) {
  return weekdays.find((weekday) => weekday.value === value)?.label ?? value;
}

function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return (hours * 60) + minutes;
}

function businessFromSlug(slug: string) {
  return slug.includes("beauty") ? "belleza" : "barberia";
}

function locationName(data: AdminAvailabilityData, locationId: string | null) {
  if (!locationId) {
    return "General";
  }

  return data.locations.find((location) => location.id === locationId)?.name ?? "Sucursal";
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Santiago",
  }).format(new Date(value));
}
