import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { TenantContextService } from "./tenant-context.service";
import { TenantGuard } from "./tenant.guard";

@Module({
  imports: [AuthModule],
  providers: [TenantContextService, TenantGuard],
  exports: [TenantContextService, TenantGuard],
})
export class TenancyModule {}
