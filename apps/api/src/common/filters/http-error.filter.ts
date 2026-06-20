import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
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

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
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
}
