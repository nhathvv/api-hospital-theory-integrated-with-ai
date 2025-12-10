import { Module } from '@nestjs/common';
import { AdminDoctorController } from './doctor/admin-doctor.controller';
import { AdminPatientController } from './patient/admin-patient.controller';
import { AdminDepartmentController } from './department/admin-department.controller';
import { AdminSpecialtyController } from './specialty/admin-specialty.controller';
import { AdminDoctorScheduleController } from './doctor-schedule/admin-doctor-schedule.controller';
import { DoctorModule } from '../doctor';
import { PatientModule } from '../patient';
import { DepartmentModule } from '../department';
import { SpecialtyModule } from '../specialty';
import { DoctorScheduleModule } from '../doctor-schedule';

@Module({
  imports: [
    DoctorModule,
    PatientModule,
    DepartmentModule,
    SpecialtyModule,
    DoctorScheduleModule,
  ],
  controllers: [
    AdminDoctorController,
    AdminPatientController,
    AdminDepartmentController,
    AdminSpecialtyController,
    AdminDoctorScheduleController,
  ],
})
export class AdminModule {}
