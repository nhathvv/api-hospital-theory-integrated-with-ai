import { Module } from '@nestjs/common';
import { DoctorScheduleService } from './doctor-schedule.service';
import { PrismaModule } from '../prisma';

@Module({
  imports: [PrismaModule],
  providers: [DoctorScheduleService],
  exports: [DoctorScheduleService],
})
export class DoctorScheduleModule {}
