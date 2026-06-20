import { Injectable } from "@nestjs/common";
import { AsyncLocalStorage } from "node:async_hooks";

import type { TenantContext } from "../common/types/request-user";

@Injectable()
export class TenantContextService {
  private readonly storage = new AsyncLocalStorage<TenantContext>();

  set(context: TenantContext): void {
    this.storage.enterWith(context);
  }

  get(): TenantContext | undefined {
    return this.storage.getStore();
  }
}
