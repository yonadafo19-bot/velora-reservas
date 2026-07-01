import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ExceptionFilter,
} from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";

import { RequestContextService } from "../request-context/request-context.service";

interface ErrorBody {
  code: string;
  message: string;
  details?: unknown;
  requestId: string;
  timestamp: string;
}

interface ExceptionPayload {
  code?: unknown;
  message?: unknown;
  details?: unknown;
}

const MAX_LOG_MESSAGE_LENGTH = 300;
const MAX_LOG_STRING_LENGTH = 160;
const MAX_LOG_DEPTH = 2;
const SENSITIVE_KEY_PATTERN = /authorization|cookie|token|password|secret|api[_-]?key|database[_-]?url|databaseurl|credential|private[_-]?key|body|headers|payload/i;
const SENSITIVE_TEXT_PATTERNS = [
  /\bBearer\s+\S+/gi,
  /\b(?:authorization|cookie|set-cookie|token|password|secret|api[_-]?key|database_url|databaseurl)\b\s*[:=]\s*(?:Bearer\s+)?[^,\s;}]*/gi,
  /postgres(?:ql)?:\/\/\S+/gi,
];

function getExceptionPayload(exception: HttpException): ExceptionPayload {
  const response = exception.getResponse();
  return typeof response === "string" ? { message: response } : response;
}

function getDefaultMessage(status: number): string {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return "La solicitud no es válida.";
    case HttpStatus.UNAUTHORIZED:
      return "Se requiere autenticación.";
    case HttpStatus.FORBIDDEN:
      return "No tienes permisos para realizar esta acción.";
    case HttpStatus.NOT_FOUND:
      return "Recurso no encontrado.";
    case HttpStatus.CONFLICT:
      return "La solicitud entra en conflicto con el estado actual.";
    case HttpStatus.INTERNAL_SERVER_ERROR:
      return "Ocurrió un error interno.";
    default:
      return "La solicitud no pudo completarse.";
  }
}

function redactSensitiveText(value: string): string {
  return SENSITIVE_TEXT_PATTERNS.reduce(
    (current, pattern) => current.replace(pattern, "[redacted]"),
    value,
  );
}

function truncate(value: string, maxLength: number): string {
  const redacted = redactSensitiveText(value);
  return redacted.length > maxLength ? `${redacted.slice(0, maxLength)}...` : redacted;
}

function getErrorString(exception: unknown, key: "name" | "code" | "message"): string | undefined {
  if (!exception || typeof exception !== "object") {
    return undefined;
  }

  const value = (exception as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}

function getErrorMeta(exception: unknown): unknown {
  if (!exception || typeof exception !== "object") {
    return undefined;
  }

  return (exception as { meta?: unknown }).meta;
}

function sanitizeLogValue(value: unknown, depth = 0, seen = new WeakSet<object>()): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value === "string") {
    return truncate(value, MAX_LOG_STRING_LENGTH);
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (Array.isArray(value)) {
    if (depth >= MAX_LOG_DEPTH) {
      return "[redacted]";
    }
    return value.slice(0, 10).map((item) => sanitizeLogValue(item, depth + 1, seen));
  }
  if (typeof value === "object") {
    if (seen.has(value)) {
      return "[redacted]";
    }
    if (depth >= MAX_LOG_DEPTH) {
      return "[redacted]";
    }

    seen.add(value);
    const entries = Object.entries(value as Record<string, unknown>).slice(0, 20);
    return Object.fromEntries(entries.map(([key, entryValue]) => [
      key,
      SENSITIVE_KEY_PATTERN.test(key)
        ? "[redacted]"
        : sanitizeLogValue(entryValue, depth + 1, seen),
    ]));
  }

  return "[redacted]";
}

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpErrorFilter.name);

  constructor(
    private readonly adapterHost: HttpAdapterHost,
    private readonly context: RequestContextService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const payload = exception instanceof HttpException
      ? getExceptionPayload(exception)
      : {};
    const requestId = this.context.getRequestId() ?? "unavailable";

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logInternalError(exception, requestId);
    }

    const body: ErrorBody = {
      code: typeof payload.code === "string"
        ? payload.code
        : status === HttpStatus.INTERNAL_SERVER_ERROR
          ? "INTERNAL_SERVER_ERROR"
          : `HTTP_${status}`,
      message: typeof payload.code === "string" && typeof payload.message === "string"
        ? payload.message
        : Array.isArray(payload.message)
          ? "La solicitud contiene datos inválidos."
          : getDefaultMessage(status),
      requestId,
      timestamp: new Date().toISOString(),
    };

    if (payload.details !== undefined) {
      body.details = payload.details;
    } else if (Array.isArray(payload.message)) {
      body.details = payload.message;
    }

    this.adapterHost.httpAdapter.reply(host.switchToHttp().getResponse(), body, status);
  }

  private logInternalError(exception: unknown, requestId: string): void {
    const logEntry = {
      event: "internal_error",
      requestId,
      errorName: getErrorString(exception, "name") ?? "UnknownError",
      errorCode: getErrorString(exception, "code") ?? null,
      errorMeta: sanitizeLogValue(getErrorMeta(exception)),
      message: truncate(
        getErrorString(exception, "message") ?? "Unhandled internal error.",
        MAX_LOG_MESSAGE_LENGTH,
      ),
    };

    this.logger.error(JSON.stringify(logEntry));
  }
}
