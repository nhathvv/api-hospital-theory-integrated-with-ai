import { Module } from '@nestjs/common';
import { PatientController } from './patient.controller';
import { PatientService } from './patient.service';
import { PrismaModule } from '../prisma';
import { PaymentModule } from '../payment';
import { AppointmentModule } from '../appointment';

@Module({
  imports: [PrismaModule, PaymentModule, AppointmentModule],
  controllers: [PatientController],
  providers: [PatientService],
  exports: [PatientService],
})
export class PatientModule {}
