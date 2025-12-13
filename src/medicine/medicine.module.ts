import { Module } from '@nestjs/common';
import { MedicineService } from './medicine.service';
import { PrismaModule } from '../prisma';

@Module({
  imports: [PrismaModule],
  providers: [MedicineService],
  exports: [MedicineService],
})
export class MedicineModule {}
