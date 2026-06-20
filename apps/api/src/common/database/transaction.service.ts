import { Injectable } from "@nestjs/common";
import { AsyncLocalStorage } from "node:async_hooks";

import { DatabaseService } from "./database.service";
import type { PrismaTransaction, TransactionCallback } from "./prisma-transaction";

export class NestedTransactionError extends Error {
  readonly code = "NESTED_TRANSACTION_NOT_ALLOWED";

  constructor() {
    super("Las transacciones anidadas requieren una decisión explícita.");
    this.name = "NestedTransactionError";
  }
}

@Injectable()
export class TransactionService {
  private readonly storage = new AsyncLocalStorage<PrismaTransaction>();

  constructor(private readonly database: DatabaseService) {}

  async runInTransaction<T>(callback: TransactionCallback<T>): Promise<T> {
    if (this.storage.getStore()) {
      throw new NestedTransactionError();
    }

    return this.database.getClient().$transaction(
      (transaction) => this.storage.run(transaction, () => callback(transaction)),
    );
  }

  getCurrentTransaction(): PrismaTransaction | undefined {
    return this.storage.getStore();
  }
}
