import { Module } from "@nestjs/common";

import { RepositoriesModule } from "../repositories/repositories.module";
import { AuditWriterService } from "./audit-writer.service";

@Module({
  imports: [RepositoriesModule],
  providers: [AuditWriterService],
  exports: [AuditWriterService],
})
export class AuditModule {}
