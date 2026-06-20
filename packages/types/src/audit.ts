import type { EntityId, UtcIsoDateTime } from "./common.js";
import type { ActorType, AuditAction, AuditEntityType } from "./enums.js";

export type JsonPrimitive = boolean | number | string | null;
export type JsonValue = JsonPrimitive | JsonObject | readonly JsonValue[];

export interface JsonObject {
  readonly [key: string]: JsonValue;
}

export interface AuditEvent {
  readonly businessId: EntityId;
  readonly locationId?: EntityId;
  readonly actorType: ActorType;
  readonly actorId?: EntityId;
  readonly entityType: AuditEntityType;
  readonly entityId: EntityId;
  readonly action: AuditAction;
  readonly beforeJson?: JsonObject;
  readonly afterJson?: JsonObject;
  readonly metadataJson?: JsonObject;
  readonly ipAddress?: string;
  readonly userAgent?: string;
  readonly createdAtUtc: UtcIsoDateTime;
}
