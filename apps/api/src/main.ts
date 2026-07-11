import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { existsSync, mkdirSync } from 'fs';
import { AppModule } from './app.module';
import { AppLogger } from './common/logger/app.logger';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger: new AppLogger() });

  // CORS для Vercel + Railway
  const adminUrl = process.env.ADMIN_URL || 'http://localhost:3000';
  app.enableCors({
    origin: [adminUrl, 'https://svoyr.vercel.app', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  const storageDir = process.env.STORAGE_DIR || '/tmp/svoy_storage';
  if (!existsSync(storageDir)) mkdirSync(storageDir, { recursive: true });
  // В Nest 10 useStaticAssets есть на ExpressAdapter
  app.useStaticAssets(storageDir, { prefix: '/storage/' });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('СВОЙ API')
    .setDescription('API документация проекта СВОЙ')
    .setVersion('1.0.0-rc.2')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = Number(process.env.PORT || 3001);
  await app.listen(port, '0.0.0.0');
  console.log(`API listening on ${port}`);
}

bootstrap();
