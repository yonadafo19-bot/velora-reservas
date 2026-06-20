export const DEFAULT_OPERATIONAL_TIME_ZONE = "America/Santiago" as const;
export const SUPPORTED_TIME_ZONES = [DEFAULT_OPERATIONAL_TIME_ZONE] as const;

export type SupportedTimeZone = (typeof SUPPORTED_TIME_ZONES)[number];

export function isSupportedTimeZone(value: unknown): value is SupportedTimeZone {
  return typeof value === "string" && SUPPORTED_TIME_ZONES.some((zone) => zone === value);
}

export function resolveOperationalTimeZone(value?: string): SupportedTimeZone {
  if (value === undefined) {
    return DEFAULT_OPERATIONAL_TIME_ZONE;
  }

  if (!isSupportedTimeZone(value)) {
    throw new RangeError(`Unsupported operational time zone: ${value}`);
  }

  return value;
}

export function isUtcIsoDateTime(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.endsWith("Z") &&
    !Number.isNaN(Date.parse(value))
  );
}
