import { Injectable } from "@nestjs/common";

const DEFAULT_PORT = 3001;
const DEFAULT_API_PREFIX = "/api/v1";
const DEFAULT_CORS_ORIGINS = ["http://localhost:3000"];
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

@Injectable()
export class AppConfig {
  readonly environment = readEnvironment(process.env.NODE_ENV);
  readonly port = readPort(process.env.PORT);
  readonly apiPrefix = readApiPrefix(process.env.API_PREFIX);
  readonly corsOrigins = readCorsOrigins(process.env.CORS_ORIGINS);
  readonly service = "velora-api";
  readonly version = "0.1.0";
}
