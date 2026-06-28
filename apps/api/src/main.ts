import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { existsSync, mkdirSync } from 'fs';
import { AppModule } from './app.module';
import { AppLogger } from './common/logger/app.logger';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new AppLogger(),
  });

  app.enableCors({
    origin: [process.env.ADMIN_URL || 'http://localhost:3000'],
    credentials: true,
  });

  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  const storageDir = process.env.STORAGE_DIR || '/tmp/svoy_storage';
  if (!existsSync(storageDir)) {
    mkdirSync(storageDir, { recursive: true });
  }

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.use('/storage', require('express').static(storageDir));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('СВОЙ API')
    .setDescription('API документация проекта СВОЙ')
    .setVersion('1.0.0-rc.1')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(Number(process.env.PORT || 3001));
}

bootstrap();
