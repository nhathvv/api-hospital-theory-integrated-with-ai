import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config } from 'dotenv';
import { EnvService } from './configs/envs/env-service';
async function bootstrap() {
  config();
  EnvService.getInstance().validate(process.env);
  const app = await NestFactory.create(AppModule);
  await app.listen(EnvService.getInstance().getPort());
}
bootstrap();
