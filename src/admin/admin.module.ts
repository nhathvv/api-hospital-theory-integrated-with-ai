import { Module } from '@nestjs/common';
import { AdminDoctorController } from './doctor/admin-doctor.controller';
import { AdminPatientController } from './patient/admin-patient.controller';
import { AdminDepartmentController } from './department/admin-department.controller';
import { AdminSpecialtyController } from './specialty/admin-specialty.controller';
import { AdminDoctorScheduleController } from './doctor-schedule/admin-doctor-schedule.controller';
import { AdminMedicineCategoryController } from './medicine-category/admin-medicine-category.controller';
import { AdminMedicineController } from './medicine/admin-medicine.controller';
import { AdminMedicineBatchController } from './medicine-batch/admin-medicine-batch.controller';
import { AdminPaymentController } from './payment/admin-payment.controller';
import { AdminAppointmentController } from './appointment/admin-appointment.controller';
import { AdminConversationController } from './conversation/admin-conversation.controller';
import { DoctorModule } from '../doctor';
import { PatientModule } from '../patient';
import { DepartmentModule } from '../department';
import { SpecialtyModule } from '../specialty';
import { DoctorScheduleModule } from '../doctor-schedule';
import { MedicineCategoryModule } from '../medicine-category';
import { MedicineModule } from '../medicine';
import { MedicineBatchModule } from '../medicine-batch';
import { PaymentModule } from '../payment';
import { AppointmentModule } from '../appointment';
import { ConversationModule } from '../conversation';

@Module({
  imports: [
    DoctorModule,
    PatientModule,
    DepartmentModule,
    SpecialtyModule,
    DoctorScheduleModule,
    MedicineCategoryModule,
    MedicineModule,
    MedicineBatchModule,
    PaymentModule,
    AppointmentModule,
    ConversationModule,
  ],
  controllers: [
    AdminDoctorController,
    AdminPatientController,
    AdminDepartmentController,
    AdminSpecialtyController,
    AdminDoctorScheduleController,
    AdminMedicineCategoryController,
    AdminMedicineController,
    AdminMedicineBatchController,
    AdminPaymentController,
    AdminAppointmentController,
    AdminConversationController,
  ],
})
export class AdminModule {}
