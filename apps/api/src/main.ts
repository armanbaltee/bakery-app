import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app/app.module';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: [
      process.env['FRONTEND_URL'] || 'http://localhost:4200',
      process.env['ADMIN_URL'] || 'http://localhost:4201',
    ],
    credentials: true,
  });

  // Serve uploaded files
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  // Swagger docs
  const config = new DocumentBuilder()
    .setTitle('Bakery API')
    .setDescription('Bakery E-Commerce REST API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env['PORT'] || 3000;
  await app.listen(port);
  Logger.log(`🚀 Application is running on: http://localhost:${port}/api`);
  Logger.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
