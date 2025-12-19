import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma';
import { AuthModule } from './auth';
import { DepartmentModule } from './department';
import { SpecialtyModule } from './specialty';
import { DoctorModule } from './doctor';
import { DoctorScheduleModule } from './doctor-schedule';
import { PatientModule } from './patient';
import { MedicineCategoryModule } from './medicine-category';
import { MedicineModule } from './medicine';
import { MedicineBatchModule } from './medicine-batch';
import { AdminModule } from './admin';
import { AppointmentModule } from './appointment';
import { PaymentModule } from './payment/payment.module';
import { EnvService } from './configs/envs/env-service';
import { BullModule } from '@nestjs/bullmq';

const envService = EnvService.getInstance();

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: envService.getRedisHost(),
        port: envService.getRedisPort(),
        username: envService.getRedisUsername(),
        password: envService.getRedisPassword(),
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: envService.getThrottleTtl(),
        limit: envService.getThrottleLimit(),
      },
    ]),
    PrismaModule,
    AuthModule,
    DepartmentModule,
    SpecialtyModule,
    DoctorModule,
    DoctorScheduleModule,
    PatientModule,
    MedicineCategoryModule,
    MedicineModule,
    MedicineBatchModule,
    AdminModule,
    AppointmentModule,
    PaymentModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
