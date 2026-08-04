import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.use(cookieParser());
  app.enableCors({
    origin: config.getOrThrow<string>('CLIENT_URL'),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('BNR Music API')
      .setDescription('BNR Music server API')
      .setVersion('2.0')
      .addBearerAuth()
      .build(),
  );
  SwaggerModule.setup('/api/docs', app, document);

  await app.listen(config.getOrThrow<number>('PORT'));
}

void bootstrap();
