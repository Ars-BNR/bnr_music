import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { SeedService } from './seed.service';

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    await app.get(SeedService).seed();
  } finally {
    await app.close();
  }
}

void main();
