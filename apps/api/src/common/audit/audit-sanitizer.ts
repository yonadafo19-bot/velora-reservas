import type { Prisma } from "@velora/database";

import type { AuditJsonObject } from "./audit-event.types";

const SENSITIVE_KEYS = /(authorization|cookie|credential|password|secret|token|apikey|privatekey)/;
const MAX_DEPTH = 8;

type SanitizedJson = boolean | number | string | null | SanitizedJson[] | {
  [key: string]: SanitizedJson;
};

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[-_\s]/g, "");
}

function sanitizeValue(value: unknown, depth: number): SanitizedJson | undefined {
  if (depth > MAX_DEPTH) {
    return "[REDACTED_DEPTH_LIMIT]";
  }

  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeValue(item, depth + 1))
      .filter((item): item is SanitizedJson => item !== undefined);
  }

  if (typeof value === "object") {
    const sanitized: Record<string, SanitizedJson> = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      if (SENSITIVE_KEYS.test(normalizeKey(key))) {
        sanitized[key] = "[REDACTED]";
        continue;
      }

      const cleanValue = sanitizeValue(nestedValue, depth + 1);
      if (cleanValue !== undefined) {
        sanitized[key] = cleanValue;
      }
    }

    return sanitized;
  }

  return undefined;
}

export function sanitizeAuditJson(value: AuditJsonObject): Prisma.InputJsonObject {
  return sanitizeValue(value, 0) as unknown as Prisma.InputJsonObject;
}
