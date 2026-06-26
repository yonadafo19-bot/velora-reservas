import { Injectable } from "@nestjs/common";

const DEFAULT_PORT = 3001;
const DEFAULT_API_PREFIX = "/api/v1";
const DEFAULT_CORS_ORIGINS = ["http://localhost:3000"];
const DEFAULT_SUPABASE_AUDIENCE = "authenticated";
const SUPPORTED_ENVIRONMENTS = ["development", "test", "production"] as const;

type NodeEnvironment = (typeof SUPPORTED_ENVIRONMENTS)[number];

function readPort(value: string | undefined): number {
  if (value === undefined || value.trim() === "") {
    return DEFAULT_PORT;
  }

  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PORT debe ser un entero entre 1 y 65535.");
  }

  return port;
}

function readEnvironment(value: string | undefined): NodeEnvironment {
  const environment = value ?? "development";
  if (!SUPPORTED_ENVIRONMENTS.includes(environment as NodeEnvironment)) {
    throw new Error("NODE_ENV debe ser development, test o production.");
  }

  return environment as NodeEnvironment;
}

function readApiPrefix(value: string | undefined): string {
  const prefix = value?.trim() || DEFAULT_API_PREFIX;
  if (!/^\/[a-z0-9/-]+$/i.test(prefix) || prefix.endsWith("/")) {
    throw new Error("API_PREFIX debe comenzar con / y no terminar con /.");
  }

  return prefix;
}

function readCorsOrigins(value: string | undefined): string[] {
  const origins = value === undefined
    ? DEFAULT_CORS_ORIGINS
    : value.split(",").map((origin) => origin.trim()).filter(Boolean);

  if (origins.includes("*")) {
    throw new Error("CORS_ORIGINS no permite comodines.");
  }

  for (const origin of origins) {
    const parsedOrigin = new URL(origin);
    if (!(["http:", "https:"] as string[]).includes(parsedOrigin.protocol) || parsedOrigin.origin !== origin) {
      throw new Error(`Origen CORS inválido: ${origin}`);
    }
  }

  return origins;
}

function readBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value.trim() === "") {
    return defaultValue;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw new Error("AUTH_REQUIRED debe ser true o false.");
}

function readOptionalUrl(name: string, value: string | undefined): string | undefined {
  const normalized = value?.trim().replace(/\/$/, "");
  if (!normalized) {
    return undefined;
  }

  const parsed = new URL(normalized);
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error(`${name} debe usar http o https.`);
  }

  return normalized;
}

@Injectable()
export class AppConfig {
  readonly environment = readEnvironment(process.env.NODE_ENV);
  readonly port = readPort(process.env.PORT);
  readonly apiPrefix = readApiPrefix(process.env.API_PREFIX);
  readonly corsOrigins = readCorsOrigins(process.env.CORS_ORIGINS);
  readonly service = "velora-api";
  readonly version = "0.1.0";
  readonly authRequired = readBoolean(
    process.env.AUTH_REQUIRED,
    this.environment === "production",
  );
  readonly supabaseProjectUrl = readOptionalUrl(
    "SUPABASE_PROJECT_URL",
    process.env.SUPABASE_PROJECT_URL,
  );
  readonly supabaseIssuerUrl = readOptionalUrl(
    "SUPABASE_ISSUER_URL",
    process.env.SUPABASE_ISSUER_URL,
  ) ?? (this.supabaseProjectUrl ? `${this.supabaseProjectUrl}/auth/v1` : undefined);
  readonly supabaseJwksUrl = readOptionalUrl(
    "SUPABASE_JWKS_URL",
    process.env.SUPABASE_JWKS_URL,
  ) ?? (this.supabaseIssuerUrl ? `${this.supabaseIssuerUrl}/.well-known/jwks.json` : undefined);
  readonly supabaseJwtAudience = process.env.SUPABASE_JWT_AUDIENCE?.trim()
    || DEFAULT_SUPABASE_AUDIENCE;
  readonly databaseUrl = process.env.DATABASE_URL?.trim() || undefined;

  constructor() {
    if (this.environment === "production" && !this.authRequired) {
      throw new Error("AUTH_REQUIRED=false no está permitido en production.");
    }

    if (this.authRequired && (!this.supabaseIssuerUrl || !this.supabaseJwksUrl)) {
      throw new Error(
        "Autenticación requerida: configura SUPABASE_PROJECT_URL o SUPABASE_ISSUER_URL y, si corresponde, SUPABASE_JWKS_URL.",
      );
    }

    if (this.authRequired && !this.databaseUrl) {
      throw new Error("Autenticación requerida: configura DATABASE_URL.");
    }
  }
}
