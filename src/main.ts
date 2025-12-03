import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { config } from 'dotenv';
import { EnvService } from './configs/envs/env-service';
import { setupSwagger } from './configs/swagger.config';
import { AllExceptionsFilter, ResponseInterceptor } from './common';

async function bootstrap() {
  if (process.env.NODE_ENV !== 'production') {
    config();
  }
  EnvService.getInstance().validate(process.env);
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());
  setupSwagger(app);
  await app.listen(EnvService.getInstance().getPort());
}
bootstrap();
