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
import { MedicineCategoryModule } from './medicine-category';
import { MedicineModule } from './medicine';
import { MedicineBatchModule } from './medicine-batch';
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
    MedicineCategoryModule,
    MedicineModule,
    MedicineBatchModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
