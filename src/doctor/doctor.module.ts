import { Module } from '@nestjs/common';
import { DoctorController } from './doctor.controller';
import { DoctorService } from './doctor.service';
import { PrismaModule } from '../prisma';
import { UserModule } from '../user';
import { PrescriptionModule } from '../prescription';

@Module({
  imports: [PrismaModule, UserModule, PrescriptionModule],
  controllers: [DoctorController],
  providers: [DoctorService],
  exports: [DoctorService],
})
export class DoctorModule {}
