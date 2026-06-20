import "reflect-metadata";

import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";
import { AppConfig } from "./common/config/app-config";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(AppConfig);

  app.setGlobalPrefix(config.apiPrefix.replace(/^\/+/, ""));
  app.enableCors({
    origin: config.corsOrigins,
  });

  await app.listen(config.port);
}

void bootstrap();
