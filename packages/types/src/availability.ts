import type { EntityId, LocalDate, UtcIsoDateTime } from "./common.js";

export interface AvailabilityServiceSelection {
  readonly serviceId: EntityId;
  readonly durationMinutes: number;
}

export interface AvailabilityRequest {
  readonly locationId: EntityId;
  readonly services: readonly AvailabilityServiceSelection[];
  readonly dateFrom: LocalDate;
  readonly dateTo: LocalDate;
  readonly preferredProfessionalId?: EntityId;
  readonly timeZone?: string;
}

export interface AvailabilitySegmentProposal {
  readonly serviceId: EntityId;
  readonly professionalId: EntityId;
  readonly startsAtUtc: UtcIsoDateTime;
  readonly endsAtUtc: UtcIsoDateTime;
}

export interface AvailabilitySlot {
  readonly startsAtUtc: UtcIsoDateTime;
  readonly endsAtUtc: UtcIsoDateTime;
  readonly segments: readonly AvailabilitySegmentProposal[];
}

export interface AvailabilityResponse {
  readonly timeZone: string;
  readonly slots: readonly AvailabilitySlot[];
}
