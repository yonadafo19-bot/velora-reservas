"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  createAdminProfessionalAction,
  updateAdminProfessionalAction,
  updateAdminProfessionalServicesAction,
} from "@/app/admin/profesionales/actions";
import type {
  AdminProfessional,
  AdminProfessionalAssignableService,
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
};

const statusLabel: Record<AdminProfessionalStatus, string> = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  ARCHIVED: "Archivado",
};

export function AdminProfessionalsPanel({ state }: { state: AdminProfessionalsLoadState }) {
  if (state.status === "MISSING_CONFIG") {
    return <ProfessionalsStateNotice
      title="Profesionales reales no disponibles"
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
  />;
}

function ConnectedProfessionalsPanel({
  businessSlug,
  professionals,
  services,
}: {
  businessSlug: string;
  professionals: AdminProfessional[];
  services: AdminProfessionalAssignableService[];
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

      const servicesResult = await updateAdminProfessionalServicesAction({
        businessSlug,
        professionalId: professionalResult.professional.id,
        serviceIds: formState.serviceIds,
      });

      if (!servicesResult.ok) {
        setMessage({ type: "error", text: servicesResult.message });
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
      <article><small>Total profesionales</small><strong>{professionals.length}</strong><em>Equipo conectado al API</em></article>
      <article><small>Activos</small><strong>{activeCount}</strong><em>Disponibles para agenda</em></article>
      <article><small>Inactivos / archivados</small><strong>{professionals.length - activeCount}</strong><em>No aparecen como activos</em></article>
      <article><small>Servicios activos</small><strong>{services.length}</strong><em>Asignables al equipo</em></article>
    </div>

    <section className="admin-panel">
      <div className="panel-heading">
        <div>
          <h2>{isEditing ? "Editar profesional" : "Nuevo profesional"}</h2>
          <p>Los cambios se guardan en el API real de Velora.</p>
        </div>
        <span className="status status--confirmed">REAL_CONNECTED</span>
      </div>

      <ProfessionalForm
        value={formState}
        services={services}
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

      {message && <div className="demo-notice" style={{ marginTop: 14, background: message.type === "success" ? "#e5f1e9" : "#f5e7e6" }}>
        <span><strong>{message.type === "success" ? "Guardado" : "No se pudo guardar"}</strong>{message.text}</span>
      </div>}
    </section>

    <section className="admin-panel">
      <div className="panel-heading">
        <div>
          <h2>Profesionales reales</h2>
          <p>{professionals.length === 0 ? "Aun no hay profesionales creados." : "Selecciona un profesional para editarlo."}</p>
        </div>
      </div>
      {professionals.length === 0
        ? <div className="demo-notice"><span><strong>Equipo vacio</strong>Crea el primer profesional para asignarlo a la agenda.</span></div>
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
  isPending,
  onCancel,
  onChange,
  onSubmit,
}: {
  value: FormState;
  services: AdminProfessionalAssignableService[];
  isPending: boolean;
  onCancel: () => void;
  onChange: (patch: Partial<FormState>) => void;
  onSubmit: () => void;
}) {
  return <form onSubmit={(event) => {
    event.preventDefault();
    onSubmit();
  }}>
    <div className="form-grid">
      <label>Nombre<input value={value.displayName} onChange={(event) => onChange({ displayName: event.target.value })} placeholder="Ej. Matias Rojas"/></label>
      <label>Estado<select value={value.status} onChange={(event) => onChange({ status: event.target.value as AdminProfessionalStatus })}><option value="ACTIVE">Activo</option><option value="INACTIVE">Inactivo</option><option value="ARCHIVED">Archivado</option></select></label>
      <label>Rol<input value={value.roleTitle} onChange={(event) => onChange({ roleTitle: event.target.value })} placeholder="Ej. Barbero senior"/></label>
      <label>Telefono<input value={value.phone} inputMode="tel" onChange={(event) => onChange({ phone: event.target.value })} placeholder="+56 9 1234 5678"/></label>
      <label className="full">Correo<input value={value.email} type="email" onChange={(event) => onChange({ email: event.target.value })} placeholder="nombre@correo.cl"/></label>
      <label className="full">Bio<input value={value.bio} onChange={(event) => onChange({ bio: event.target.value })} placeholder="Detalle breve del perfil"/></label>
    </div>
    <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
      <strong style={{ fontSize: 13 }}>Servicios asignados</strong>
      {services.length === 0
        ? <div className="demo-notice"><span><strong>Sin servicios activos</strong>Crea o activa servicios antes de asignarlos al equipo.</span></div>
        : <div className="form-grid">{services.map((service) => <label key={service.id} style={{ alignItems: "center", display: "flex", flexDirection: "row", gap: 10 }}>
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
    <div className="button-row" style={{ justifyContent: "flex-end", marginTop: 18 }}>
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
  return <article className="professional-card" style={isSelected ? { outline: "2px solid rgba(58, 73, 45, .32)" } : undefined}>
    <span className="large-avatar">{initials(professional.displayName)}</span>
    <h3>{professional.displayName}</h3>
    <p>{professional.roleTitle ?? "Sin rol definido."}</p>
    <div><span>{professional.services.length} servicios</span><span className={`status ${professional.status === "ACTIVE" ? "status--confirmed" : "status--cancelled"}`}>{statusLabel[professional.status]}</span></div>
    <p>{professional.services.length ? professional.services.map((service) => service.name).join(", ") : "Sin servicios asignados."}</p>
    <div className="button-row" style={{ gap: 10, justifyContent: "center", marginTop: 16 }}>
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
      <span className={`status ${mode === "warning" ? "status--pending" : "status--cancelled"}`}>{mode === "warning" ? "MISSING_CONFIG" : "API_ERROR"}</span>
    </div>
    <div className="demo-notice">
      <span><strong>No se muestran datos demo</strong>Configura el API para operar con profesionales reales persistentes.</span>
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
