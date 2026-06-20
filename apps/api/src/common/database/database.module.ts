import { Global, Module } from "@nestjs/common";

import { DatabaseService } from "./database.service";
import { TransactionService } from "./transaction.service";

@Global()
@Module({
  providers: [DatabaseService, TransactionService],
  exports: [DatabaseService, TransactionService],
})
export class DatabaseModule {}
