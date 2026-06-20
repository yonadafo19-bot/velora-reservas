import { Module } from "@nestjs/common";

import { TenancyModule } from "../../tenancy/tenancy.module";
import { LocationAccessRepository } from "./location-access.repository";
import { TenantScopeService } from "./tenant-scope.service";

@Module({
  imports: [TenancyModule],
  providers: [LocationAccessRepository, TenantScopeService],
  exports: [LocationAccessRepository, TenantScopeService],
})
export class RepositoriesModule {}
