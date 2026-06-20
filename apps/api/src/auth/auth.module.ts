import { Module } from "@nestjs/common";

import { DatabaseModule } from "../common/database/database.module";
import { AuthController } from "./auth.controller";
import { AuthGuard } from "./auth.guard";
import { AuthIdentityService } from "./auth-identity.service";
import { SupabaseJwtService } from "./supabase-jwt.service";

@Module({
  imports: [DatabaseModule],
  controllers: [AuthController],
  providers: [AuthGuard, AuthIdentityService, SupabaseJwtService],
  exports: [AuthGuard, AuthIdentityService, SupabaseJwtService],
})
export class AuthModule {}
