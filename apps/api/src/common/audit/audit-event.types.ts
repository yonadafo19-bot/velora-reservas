import type { Prisma } from "@velora/database";
import type { ActorType, AuditAction, AuditEntityType } from "@velora/types";

export type AuditJsonObject = Readonly<Record<string, unknown>>;

export interface TransactionalAuditEvent {
  businessId: string;
  locationId?: string;
  actorType: ActorType;
  actorId?: string;
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  beforeJson?: AuditJsonObject;
  afterJson?: AuditJsonObject;
  metadataJson?: AuditJsonObject;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

export type PreparedAuditEvent = Prisma.AuditLogUncheckedCreateInput;
