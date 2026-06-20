import {
  MiddlewareConsumer,
  Module,
  RequestMethod,
  type NestModule,
} from "@nestjs/common";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";

import { AuthGuard } from "./auth/auth.guard";
import { AuthModule } from "./auth/auth.module";
import { ConfigModule } from "./common/config/config.module";
import { DatabaseModule } from "./common/database/database.module";
import { HttpErrorFilter } from "./common/filters/http-error.filter";
import { RequestContextMiddleware } from "./common/request-context/request-context.middleware";
import { RequestContextModule } from "./common/request-context/request-context.module";
import { HealthModule } from "./health/health.module";
import { TenancyModule } from "./tenancy/tenancy.module";

@Module({
  imports: [
    ConfigModule,
    RequestContextModule,
    DatabaseModule,
    AuthModule,
    TenancyModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpErrorFilter,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes({
      path: "*splat",
      method: RequestMethod.ALL,
    });
  }
}
