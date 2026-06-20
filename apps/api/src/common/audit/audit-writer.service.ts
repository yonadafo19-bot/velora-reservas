import { Injectable } from "@nestjs/common";
import type {
  ActorType as PrismaActorType,
  AuditLog,
  AuditAction as PrismaAuditAction,
  AuditEntityType as PrismaAuditEntityType,
} from "@velora/database";

import type { PrismaTransaction } from "../database/prisma-transaction";
import { LocationAccessRepository } from "../repositories/location-access.repository";
import { TenantScopeService } from "../repositories/tenant-scope.service";
import { RequestContextService } from "../request-context/request-context.service";
import type { PreparedAuditEvent, TransactionalAuditEvent } from "./audit-event.types";
import { sanitizeAuditJson } from "./audit-sanitizer";

@Injectable()
export class AuditWriterService {
  constructor(
    private readonly tenantScope: TenantScopeService,
    private readonly requestContext: RequestContextService,
    private readonly locations: LocationAccessRepository,
  ) {}

  prepare(event: TransactionalAuditEvent): PreparedAuditEvent {
    const businessId = this.tenantScope.assertSameBusinessId(event.businessId);

    return {
      businessId,
      locationId: event.locationId,
      actorType: event.actorType as PrismaActorType,
      actorId: event.actorId,
      entityType: event.entityType as PrismaAuditEntityType,
      entityId: event.entityId,
      action: event.action as PrismaAuditAction,
      beforeJson: event.beforeJson ? sanitizeAuditJson(event.beforeJson) : undefined,
      afterJson: event.afterJson ? sanitizeAuditJson(event.afterJson) : undefined,
      metadataJson: event.metadataJson ? sanitizeAuditJson(event.metadataJson) : undefined,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      requestId: event.requestId ?? this.requestContext.getRequestId(),
    };
  }

  async write(
    transaction: PrismaTransaction,
    event: TransactionalAuditEvent,
  ): Promise<AuditLog> {
    if (event.locationId) {
      await this.locations.assertLocationBelongsToBusiness(
        transaction,
        event.locationId,
      );
    }

    return transaction.auditLog.create({ data: this.prepare(event) });
  }
}
