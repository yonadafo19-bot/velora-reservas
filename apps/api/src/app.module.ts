import {
  MiddlewareConsumer,
  Module,
  RequestMethod,
  type NestModule,
} from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";

import { ConfigModule } from "./common/config/config.module";
import { HttpErrorFilter } from "./common/filters/http-error.filter";
import { RequestContextMiddleware } from "./common/request-context/request-context.middleware";
import { RequestContextModule } from "./common/request-context/request-context.module";
import { HealthModule } from "./health/health.module";

@Module({
  imports: [ConfigModule, RequestContextModule, HealthModule],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpErrorFilter,
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
