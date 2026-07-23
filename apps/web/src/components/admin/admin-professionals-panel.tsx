"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  createAdminProfessionalAction,
  updateAdminProfessionalAction,
} from "@/app/admin/profesionales/actions";
import { operationalDisplayName } from "@/lib/admin-display";
import type {
  AdminProfessional,
  AdminProfessionalAssignableService,
  AdminProfessionalLocationOption,
  AdminProfessionalMutationInput,
  AdminProfessionalsLoadState,
  AdminProfessionalStatus,
} from "@/lib/admin-professionals-api";

interface FormState {
  professionalId: string | null;
  displayName: string;
  roleTitle: string;
  bio: string;
  phone: string;
  email: string;
  status: AdminProfessionalStatus;
  serviceIds: string[];
  locationIds: string[];
}

const emptyForm: FormState = {
  professionalId: null,
  displayName: "",
  roleTitle: "",
  bio: "",
  phone: "",
  email: "",
  status: "ACTIVE",
  serviceIds: [],
  locationIds: [],
};

const statusLabel: Record<AdminProfessionalStatus, string> = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  ARCHIVED: "Archivado",
};

export function AdminProfessionalsPanel({ state }: { state: AdminProfessionalsLoadState }) {
  if (state.status === "MISSING_CONFIG") {
    return <ProfessionalsStateNotice
      title="Equipo no disponible"
      message={state.message}
      mode="warning"
    />;
  }

  if (state.status === "API_ERROR") {
    return <ProfessionalsStateNotice
      title="No pudimos cargar profesionales"
      message={state.httpStatus ? `${state.message} Codigo HTTP: ${state.httpStatus}.` : state.message}
      mode="error"
    />;
  }

  return <ConnectedProfessionalsPanel
    businessSlug={state.businessSlug}
    professionals={state.professionals}
    services={state.services}
    locations={state.locations}
  />;
}

function ConnectedProfessionalsPanel({
  businessSlug,
  professionals,
  services,
  locations,
}: {
  businessSlug: string;
  professionals: AdminProfessional[];
  services: AdminProfessionalAssignableService[];
  locations: AdminProfessionalLocationOption[];
}) {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>(emptyForm);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const isEditing = Boolean(formState.professionalId);
  const activeCount = professionals.filter((professional) => professional.status === "ACTIVE").length;

  function selectProfessional(professional: AdminProfessional) {
    setFormState({
      professionalId: professional.id,
      displayName: professional.displayName,
      roleTitle: professional.roleTitle ?? "",
      bio: professional.bio ?? "",
      phone: "",
      email: "",
      status: professional.status,
      serviceIds: professional.services.map((service) => service.id),
      locationIds: professional.locations.map((location) => location.id),
    });
    setMessage(null);
  }

  function submit() {
    const payload = toProfessionalActionInput(businessSlug, formState);
    if (!payload.ok) {
      setMessage({ type: "error", text: payload.message });
      return;
    }

    startTransition(async () => {
      const professionalResult = isEditing
        ? await updateAdminProfessionalAction({
          ...payload.input,
          professionalId: formState.professionalId ?? undefined,
        })
        : await createAdminProfessionalAction(payload.input);

      if (!professionalResult.ok) {
        setMessage({ type: "error", text: professionalResult.message });
        return;
      }

      setMessage({
        type: "success",
        text: isEditing ? "Profesional actualizado correctamente." : "Profesional creado correctamente.",
      });
      setFormState(emptyForm);
      router.refresh();
    });
  }

  return <div style={{ display: "grid", gap: 18 }}>
    <div className="metric-grid">
      <article><small>Total profesionales</small><strong>{professionals.length}</strong><em>Equipo del negocio</em></article>
      <article><small>Activos</small><strong>{activeCount}</strong><em>Disponibles para agenda</em></article>
      <article><small>Inactivos / archivados</small><strong>{professionals.length - activeCount}</strong><em>No aparecen como activos</em></article>
      <article><small>Servicios activos</small><strong>{services.length}</strong><em>Asignables al equipo</em></article>
      <article><small>Sucursales activas</small><strong>{locations.length}</strong><em>Asignables al equipo</em></article>
    </div>

    <section className="admin-panel">
      <div className="panel-heading">
        <div>
          <h2>{isEditing ? "Editar profesional" : "Nuevo profesional"}</h2>
          <p>Los cambios se reflejan en la agenda del negocio.</p>
        </div>
        <span className="status status--confirmed">Disponible</span>
      </div>

      <ProfessionalForm
        value={formState}
        services={services}
        locations={locations}
        isPending={isPending}
        onCancel={() => {
          setFormState(emptyForm);
          setMessage(null);
        }}
        onChange={(patch) => {
          setFormState((current) => ({ ...current, ...patch }));
          setMessage(null);
        }}
        onSubmit={submit}
      />

      {message && <div className={`admin-message admin-message--${message.type}`} style={{ marginTop: 14 }}>
        <span><strong>{message.type === "success" ? "Guardado" : "No se pudo guardar"}</strong>{message.text}</span>
      </div>}
    </section>

    <section className="admin-panel">
      <div className="panel-heading">
        <div>
          <h2>Equipo</h2>
          <p>{professionals.length === 0 ? "Aun no hay profesionales creados." : "Selecciona un profesional para editarlo."}</p>
        </div>
      </div>
      {professionals.length === 0
        ? <div className="admin-message admin-message--info"><span><strong>Equipo vacio</strong>Crea el primer profesional para asignarlo a la agenda.</span></div>
        : <div className="admin-card-grid professional-grid">{professionals.map((professional) => <ProfessionalCard
          key={professional.id}
          professional={professional}
          isSelected={professional.id === formState.professionalId}
          isPending={isPending}
          onEdit={() => selectProfessional(professional)}
          onStatusChange={(status) => {
            startTransition(async () => {
              const result = await updateAdminProfessionalAction({
                businessSlug,
                professionalId: professional.id,
                displayName: professional.displayName,
                roleTitle: professional.roleTitle,
                bio: professional.bio,
                status,
              });

              if (result.ok) {
                setMessage({ type: "success", text: "Estado actualizado correctamente." });
                setFormState(emptyForm);
                router.refresh();
                return;
              }

              setMessage({ type: "error", text: result.message });
            });
          }}
        />)}</div>}
    </section>
  </div>;
}

function ProfessionalForm({
  value,
  services,
  locations,
  isPending,
  onCancel,
  onChange,
  onSubmit,
}: {
  value: FormState;
  services: AdminProfessionalAssignableService[];
  locations: AdminProfessionalLocationOption[];
  isPending: boolean;
  onCancel: () => void;
  onChange: (patch: Partial<FormState>) => void;
  onSubmit: () => void;
}) {
  return <form onSubmit={(event) => {
    event.preventDefault();
    onSubmit();
  }}>
    <div className="admin-field-grid">
      <label>Nombre<input value={value.displayName} onChange={(event) => onChange({ displayName: event.target.value })} placeholder="Ej. Matias Rojas"/></label>
      <label>Estado<select value={value.status} onChange={(event) => onChange({ status: event.target.value as AdminProfessionalStatus })}><option value="ACTIVE">Activo</option><option value="INACTIVE">Inactivo</option><option value="ARCHIVED">Archivado</option></select></label>
      <label>Rol<input value={value.roleTitle} onChange={(event) => onChange({ roleTitle: event.target.value })} placeholder="Ej. Barbero senior"/></label>
      <label>Telefono<input value={value.phone} inputMode="tel" onChange={(event) => onChange({ phone: event.target.value })} placeholder="+56 9 1234 5678"/></label>
      <label className="full">Correo<input value={value.email} type="email" onChange={(event) => onChange({ email: event.target.value })} placeholder="nombre@correo.cl"/></label>
      <label className="full">Bio<input value={value.bio} onChange={(event) => onChange({ bio: event.target.value })} placeholder="Detalle breve del perfil"/></label>
    </div>
    <div className="admin-form-section">
      <div className="admin-form-section__header">
        <span><strong>Servicios asignados</strong><small>Define que servicios puede tomar este profesional.</small></span>
      </div>
      {services.length === 0
        ? <div className="admin-message admin-message--warning"><span><strong>Sin servicios activos</strong>Crea o activa servicios antes de asignarlos al equipo.</span></div>
        : <div className="admin-checkbox-grid">{services.map((service) => <label key={service.id} className={`admin-checkbox-option ${value.serviceIds.includes(service.id) ? "is-selected" : ""}`}>
          <input
            type="checkbox"
            checked={value.serviceIds.includes(service.id)}
            onChange={(event) => onChange({
              serviceIds: event.target.checked
                ? [...value.serviceIds, service.id]
                : value.serviceIds.filter((serviceId) => serviceId !== service.id),
            })}
          />
          <span>{service.name}</span>
        </label>)}</div>}
    </div>
    <div className="admin-form-section">
      <div className="admin-form-section__header">
        <span><strong>Sucursales asignadas</strong><small>Selecciona dónde puede atender dentro de la agenda.</small></span>
      </div>
      {locations.length === 0
        ? <div className="admin-message admin-message--warning"><span><strong>Sin sucursales activas</strong>Activa al menos una sucursal antes de asignarla al equipo.</span></div>
        : <div className="admin-checkbox-grid">{locations.map((location) => <label key={location.id} className={`admin-checkbox-option ${value.locationIds.includes(location.id) ? "is-selected" : ""}`}>
          <input
            type="checkbox"
            checked={value.locationIds.includes(location.id)}
            onChange={(event) => onChange({
              locationIds: event.target.checked
                ? [...value.locationIds, location.id]
                : value.locationIds.filter((locationId) => locationId !== location.id),
            })}
          />
          <span>{formatLocationLabel(location)}</span>
        </label>)}</div>}
    </div>
    <div className="admin-action-row">
      <button className="button button--ghost" type="button" onClick={onCancel} disabled={isPending}>Limpiar</button>
      <button className="button" type="submit" disabled={isPending}>{isPending ? "Guardando..." : value.professionalId ? "Guardar cambios" : "Crear profesional"}</button>
    </div>
  </form>;
}

function ProfessionalCard({
  professional,
  isSelected,
  isPending,
  onEdit,
  onStatusChange,
}: {
  professional: AdminProfessional;
  isSelected: boolean;
  isPending: boolean;
  onEdit: () => void;
  onStatusChange: (status: AdminProfessionalStatus) => void;
}) {
  return <article className={`professional-card ${isSelected ? "is-selected" : ""}`}>
    <div className="professional-card__header">
      <span className="large-avatar">{initials(professional.displayName)}</span>
      <span>
        <h3>{professional.displayName}</h3>
        <p>{professional.roleTitle ?? "Sin rol definido."}</p>
      </span>
    </div>
    <div className="professional-card__meta">
      <span>{professional.services.length} servicios</span>
      <span className={`status ${professional.status === "ACTIVE" ? "status--confirmed" : "status--cancelled"}`}>{statusLabel[professional.status]}</span>
    </div>
    <div className="professional-card__details">
      <small>Servicios</small>
      <p>{professional.services.length ? professional.services.map((service) => service.name).join(", ") : "Sin servicios asignados."}</p>
    </div>
    <div className="professional-card__details">
      <small>Sucursales</small>
      <p>{professional.locations.length ? professional.locations.map(formatLocationLabel).join(", ") : "Sin sucursales asignadas."}</p>
    </div>
    <div className="admin-action-row">
      <button className="button button--ghost" type="button" onClick={onEdit} disabled={isPending}>Editar</button>
      {professional.status === "ACTIVE"
        ? <button className="button button--ghost" type="button" onClick={() => onStatusChange("INACTIVE")} disabled={isPending}>Desactivar</button>
        : <button className="button button--ghost" type="button" onClick={() => onStatusChange("ACTIVE")} disabled={isPending}>Activar</button>}
      {professional.status !== "ARCHIVED" && <button className="button button--ghost" type="button" onClick={() => onStatusChange("ARCHIVED")} disabled={isPending}>Archivar</button>}
    </div>
  </article>;
}

function ProfessionalsStateNotice({
  title,
  message,
  mode,
}: {
  title: string;
  message: string;
  mode: "warning" | "error";
}) {
  return <section className="admin-panel">
    <div className="panel-heading">
      <div>
        <h2>{title}</h2>
        <p>{message}</p>
      </div>
      <span className={`status ${mode === "warning" ? "status--pending" : "status--cancelled"}`}>{mode === "warning" ? "Revisión necesaria" : "No disponible"}</span>
    </div>
    <div className="admin-message admin-message--warning">
      <span><strong>Revisa la configuración</strong>Completa la conexión del negocio para administrar su equipo.</span>
    </div>
  </section>;
}

function toProfessionalActionInput(
  businessSlug: string,
  formState: FormState,
):
  | { ok: true; input: AdminProfessionalMutationInput }
  | { ok: false; message: string } {
  if (!formState.displayName.trim()) {
    return { ok: false, message: "Completa el nombre del profesional." };
  }

  return {
    ok: true,
    input: {
      businessSlug,
      displayName: formState.displayName,
      roleTitle: formState.roleTitle,
      bio: formState.bio,
      ...(formState.phone.trim() ? { phone: formState.phone } : {}),
      ...(formState.email.trim() ? { email: formState.email } : {}),
      status: formState.status,
      serviceIds: formState.serviceIds,
      locationIds: formState.locationIds,
    },
  };
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatLocationLabel(location: AdminProfessionalLocationOption) {
  return operationalDisplayName([location.name, location.city].filter(Boolean).join(" - "));
}
