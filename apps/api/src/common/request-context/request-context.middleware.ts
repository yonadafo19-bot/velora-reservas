import { Injectable, type NestMiddleware } from "@nestjs/common";
import { randomUUID } from "node:crypto";

import { RequestContextService } from "./request-context.service";

const REQUEST_ID_HEADER = "x-request-id";
const SAFE_REQUEST_ID = /^[A-Za-z0-9._:-]{1,128}$/;

interface RequestLike {
  headers: Record<string, string | string[] | undefined>;
}

interface ResponseLike {
  setHeader(name: string, value: string): void;
}

function resolveRequestId(value: string | string[] | undefined): string {
  if (typeof value === "string" && SAFE_REQUEST_ID.test(value)) {
    return value;
  }

  return randomUUID();
}

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly context: RequestContextService) {}

  use(request: RequestLike, response: ResponseLike, next: () => void): void {
    const requestId = resolveRequestId(request.headers[REQUEST_ID_HEADER]);
    response.setHeader(REQUEST_ID_HEADER, requestId);
    this.context.run(requestId, next);
  }
}
