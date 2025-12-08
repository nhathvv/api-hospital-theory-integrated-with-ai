import { Module } from '@nestjs/common';
import { DoctorTimeSlotController } from './doctor-time-slot.controller';
import { DoctorTimeSlotService } from './doctor-time-slot.service';
import { PrismaModule } from '../prisma';

@Module({
  imports: [PrismaModule],
  controllers: [DoctorTimeSlotController],
  providers: [DoctorTimeSlotService],
  exports: [DoctorTimeSlotService],
})
export class DoctorTimeSlotModule {}
