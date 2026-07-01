"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  createAdminServiceAction,
  updateAdminServiceAction,
} from "@/app/admin/servicios/actions";
import { formatClp, formatDuration } from "@/lib/formatting";
import type {
  AdminService,
  AdminServiceMutationInput,
  AdminServicesLoadState,
  AdminServiceStatus,
} from "@/lib/admin-services-api";

interface FormState {
  serviceId: string | null;
  name: string;
  description: string;
  basePriceClp: string;
  durationMinutes: string;
  bufferBeforeMinutes: string;
  bufferAfterMinutes: string;
  status: AdminServiceStatus;
}

const emptyForm: FormState = {
  serviceId: null,
  name: "",
  description: "",
  basePriceClp: "",
  durationMinutes: "30",
  bufferBeforeMinutes: "0",
  bufferAfterMinutes: "0",
  status: "ACTIVE",
};

const statusLabel: Record<AdminServiceStatus, string> = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  ARCHIVED: "Archivado",
};

export function AdminServicesPanel({ state }: { state: AdminServicesLoadState }) {
  if (state.status === "MISSING_CONFIG") {
    return <ServicesStateNotice
      title="Servicios reales no disponibles"
      message={state.message}
      mode="warning"
    />;
  }

  if (state.status === "API_ERROR") {
    return <ServicesStateNotice
      title="No pudimos cargar servicios"
      message={state.httpStatus ? `${state.message} Codigo HTTP: ${state.httpStatus}.` : state.message}
      mode="error"
    />;
  }

  return <ConnectedServicesPanel businessSlug={state.businessSlug} services={state.services}/>;
}

function ConnectedServicesPanel({
  businessSlug,
  services,
}: {
  businessSlug: string;
  services: AdminService[];
}) {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>(emptyForm);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const isEditing = Boolean(formState.serviceId);
  const activeCount = services.filter((service) => service.status === "ACTIVE").length;

  function selectService(service: AdminService) {
    setFormState({
      serviceId: service.id,
      name: service.name,
      description: service.description ?? "",
      basePriceClp: String(service.priceFrom),
      durationMinutes: String(service.durationMinutes),
      bufferBeforeMinutes: String(service.bufferBeforeMinutes),
      bufferAfterMinutes: String(service.bufferAfterMinutes),
      status: service.status,
    });
    setMessage(null);
  }

  function submit() {
    const payload = toActionInput(businessSlug, formState);
    if (!payload.ok) {
      setMessage({ type: "error", text: payload.message });
      return;
    }

    startTransition(async () => {
      const result = isEditing
        ? await updateAdminServiceAction({
          ...payload.input,
          serviceId: formState.serviceId ?? undefined,
        })
        : await createAdminServiceAction(payload.input);

      if (result.ok) {
        setMessage({
          type: "success",
          text: isEditing ? "Servicio actualizado correctamente." : "Servicio creado correctamente.",
        });
        setFormState(emptyForm);
        router.refresh();
        return;
      }

      setMessage({ type: "error", text: result.message });
    });
  }

  return <div style={{ display: "grid", gap: 18 }}>
    <div className="metric-grid">
      <article><small>Total servicios</small><strong>{services.length}</strong><em>Catalogo conectado al API</em></article>
      <article><small>Activos</small><strong>{activeCount}</strong><em>Disponibles para agenda</em></article>
      <article><small>Inactivos / archivados</small><strong>{services.length - activeCount}</strong><em>No aparecen como activos</em></article>
      <article><small>Estado</small><strong>Real</strong><em>Persistencia habilitada</em></article>
    </div>

    <section className="admin-panel">
      <div className="panel-heading">
        <div>
          <h2>{isEditing ? "Editar servicio" : "Nuevo servicio"}</h2>
          <p>Los cambios se guardan en el API real de Velora.</p>
        </div>
        <span className="status status--confirmed">REAL_CONNECTED</span>
      </div>

      <ServiceForm
        value={formState}
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
          <h2>Servicios reales</h2>
          <p>{services.length === 0 ? "Aun no hay servicios creados." : "Selecciona un servicio para editarlo."}</p>
        </div>
      </div>
      {services.length === 0
        ? <div className="admin-message admin-message--info"><span><strong>Catalogo vacio</strong>Crea el primer servicio para que pueda usarse en la agenda.</span></div>
        : <div className="admin-card-grid">{services.map((service) => <ServiceCard
          key={service.id}
          service={service}
          isSelected={service.id === formState.serviceId}
          isPending={isPending}
          onEdit={() => selectService(service)}
          onStatusChange={(status) => {
            setFormState({
              serviceId: service.id,
              name: service.name,
              description: service.description ?? "",
              basePriceClp: String(service.priceFrom),
              durationMinutes: String(service.durationMinutes),
              bufferBeforeMinutes: String(service.bufferBeforeMinutes),
              bufferAfterMinutes: String(service.bufferAfterMinutes),
              status,
            });
            startTransition(async () => {
              const result = await updateAdminServiceAction({
                businessSlug,
                serviceId: service.id,
                name: service.name,
                description: service.description,
                basePriceClp: service.priceFrom,
                durationMinutes: service.durationMinutes,
                bufferBeforeMinutes: service.bufferBeforeMinutes,
                bufferAfterMinutes: service.bufferAfterMinutes,
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

function ServiceForm({
  value,
  isPending,
  onCancel,
  onChange,
  onSubmit,
}: {
  value: FormState;
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
      <label>Nombre<input value={value.name} onChange={(event) => onChange({ name: event.target.value })} placeholder="Ej. Corte clasico"/></label>
      <label>Estado<select value={value.status} onChange={(event) => onChange({ status: event.target.value as AdminServiceStatus })}><option value="ACTIVE">Activo</option><option value="INACTIVE">Inactivo</option><option value="ARCHIVED">Archivado</option></select></label>
      <label className="full">Descripcion<input value={value.description} onChange={(event) => onChange({ description: event.target.value })} placeholder="Detalle breve del servicio"/></label>
      <label>Precio CLP<input value={value.basePriceClp} inputMode="numeric" onChange={(event) => onChange({ basePriceClp: event.target.value })} placeholder="22000"/></label>
      <label>Duracion minutos<input value={value.durationMinutes} inputMode="numeric" onChange={(event) => onChange({ durationMinutes: event.target.value })} placeholder="45"/></label>
      <label>Buffer antes<input value={value.bufferBeforeMinutes} inputMode="numeric" onChange={(event) => onChange({ bufferBeforeMinutes: event.target.value })}/></label>
      <label>Buffer despues<input value={value.bufferAfterMinutes} inputMode="numeric" onChange={(event) => onChange({ bufferAfterMinutes: event.target.value })}/></label>
    </div>
    <div className="admin-action-row">
      <button className="button button--ghost" type="button" onClick={onCancel} disabled={isPending}>Limpiar</button>
      <button className="button" type="submit" disabled={isPending}>{isPending ? "Guardando..." : value.serviceId ? "Guardar cambios" : "Crear servicio"}</button>
    </div>
  </form>;
}

function ServiceCard({
  service,
  isSelected,
  isPending,
  onEdit,
  onStatusChange,
}: {
  service: AdminService;
  isSelected: boolean;
  isPending: boolean;
  onEdit: () => void;
  onStatusChange: (status: AdminServiceStatus) => void;
}) {
  return <article className={`catalog-card ${isSelected ? "is-selected" : ""}`}>
    <div>
      <span className="catalog-icon">{service.name.slice(0, 1).toUpperCase()}</span>
      <span className={`status ${service.status === "ACTIVE" ? "status--confirmed" : "status--cancelled"}`}>{statusLabel[service.status]}</span>
    </div>
    <h3>{service.name}</h3>
    <p>{service.description ?? "Sin descripcion."}</p>
    <footer>
      <span>{formatDuration(service.durationMinutes)} - buffer {service.bufferBeforeMinutes}/{service.bufferAfterMinutes} min</span>
      <strong>{formatClp(service.priceFrom)}</strong>
    </footer>
    <div className="admin-action-row">
      <button className="button button--ghost" type="button" onClick={onEdit} disabled={isPending}>Editar</button>
      {service.status === "ACTIVE"
        ? <button className="button button--ghost" type="button" onClick={() => onStatusChange("INACTIVE")} disabled={isPending}>Desactivar</button>
        : <button className="button button--ghost" type="button" onClick={() => onStatusChange("ACTIVE")} disabled={isPending}>Activar</button>}
      {service.status !== "ARCHIVED" && <button className="button button--ghost" type="button" onClick={() => onStatusChange("ARCHIVED")} disabled={isPending}>Archivar</button>}
    </div>
  </article>;
}

function ServicesStateNotice({
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
    <div className="admin-message admin-message--warning">
      <span><strong>No se muestran datos demo</strong>Configura el API para operar con servicios reales persistentes.</span>
    </div>
  </section>;
}

function toActionInput(
  businessSlug: string,
  formState: FormState,
):
  | { ok: true; input: AdminServiceMutationInput }
  | { ok: false; message: string } {
  const basePriceClp = Number(formState.basePriceClp);
  const durationMinutes = Number(formState.durationMinutes);
  const bufferBeforeMinutes = Number(formState.bufferBeforeMinutes);
  const bufferAfterMinutes = Number(formState.bufferAfterMinutes);

  if (!formState.name.trim()) {
    return { ok: false, message: "Completa el nombre del servicio." };
  }

  if (!Number.isInteger(basePriceClp) || basePriceClp < 0) {
    return { ok: false, message: "Ingresa un precio CLP valido." };
  }

  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    return { ok: false, message: "Ingresa una duracion valida." };
  }

  if (!Number.isInteger(bufferBeforeMinutes) || bufferBeforeMinutes < 0
    || !Number.isInteger(bufferAfterMinutes) || bufferAfterMinutes < 0) {
    return { ok: false, message: "Ingresa buffers validos." };
  }

  return {
    ok: true,
    input: {
      businessSlug,
      name: formState.name,
      description: formState.description,
      basePriceClp,
      durationMinutes,
      bufferBeforeMinutes,
      bufferAfterMinutes,
      status: formState.status,
    },
  };
}
