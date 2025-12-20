import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma';
import { PrescriptionService } from './prescription.service';

@Module({
  imports: [PrismaModule],
  providers: [PrescriptionService],
  exports: [PrescriptionService],
})
export class PrescriptionModule {}
