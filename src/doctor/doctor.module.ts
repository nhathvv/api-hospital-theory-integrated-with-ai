import { Module } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { PrismaModule } from '../prisma';
import { UserModule } from '../user';

@Module({
  imports: [PrismaModule, UserModule],
  providers: [DoctorService],
  exports: [DoctorService],
})
export class DoctorModule {}

