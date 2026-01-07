import { Module } from '@nestjs/common';
import { PatientController } from './patient.controller';
import { PatientService } from './patient.service';
import { PrismaModule } from '../prisma';
import { PaymentModule } from '../payment';
import { AppointmentModule } from '../appointment';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [PrismaModule, PaymentModule, AppointmentModule, UploadModule],
  controllers: [PatientController],
  providers: [PatientService],
  exports: [PatientService],
})
export class PatientModule {}
