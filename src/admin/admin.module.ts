import { Module } from '@nestjs/common';
import { AdminDoctorController } from './doctor/admin-doctor.controller';
import { AdminPatientController } from './patient/admin-patient.controller';
import { AdminDepartmentController } from './department/admin-department.controller';
import { AdminSpecialtyController } from './specialty/admin-specialty.controller';
import { AdminDoctorScheduleController } from './doctor-schedule/admin-doctor-schedule.controller';
import { AdminMedicineCategoryController } from './medicine-category/admin-medicine-category.controller';
import { DoctorModule } from '../doctor';
import { PatientModule } from '../patient';
import { DepartmentModule } from '../department';
import { SpecialtyModule } from '../specialty';
import { DoctorScheduleModule } from '../doctor-schedule';
import { MedicineCategoryModule } from '../medicine-category';

@Module({
  imports: [
    DoctorModule,
    PatientModule,
    DepartmentModule,
    SpecialtyModule,
    DoctorScheduleModule,
    MedicineCategoryModule,
  ],
  controllers: [
    AdminDoctorController,
    AdminPatientController,
    AdminDepartmentController,
    AdminSpecialtyController,
    AdminDoctorScheduleController,
    AdminMedicineCategoryController,
  ],
})
export class AdminModule {}
