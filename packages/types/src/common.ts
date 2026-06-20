import type { BusinessVertical } from "./enums.js";

export type EntityId = string;
export type UtcIsoDateTime = string;
export type LocalDate = string;
export type CurrencyCode = "CLP";

export interface BusinessReference {
  readonly id: EntityId;
  readonly slug: string;
  readonly vertical: BusinessVertical;
  readonly timeZone: string;
  readonly currency: CurrencyCode;
}

export interface LocationReference {
  readonly id: EntityId;
  readonly businessId: EntityId;
  readonly slug: string;
  readonly timeZone: string;
}
