import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma';
import { AuthModule } from './auth';
import { DepartmentModule } from './department';
import { SpecialtyModule } from './specialty';
import { DoctorModule } from './doctor';
import { DoctorScheduleModule } from './doctor-schedule';
import { PatientModule } from './patient';
import { AdminModule } from './admin';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    DepartmentModule,
    SpecialtyModule,
    DoctorModule,
    DoctorScheduleModule,
    PatientModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
