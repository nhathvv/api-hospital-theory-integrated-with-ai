import { Module } from '@nestjs/common';
import { SpecialtyService } from './specialty.service';
import { PrismaModule } from '../prisma';

@Module({
  imports: [PrismaModule],
  providers: [SpecialtyService],
  exports: [SpecialtyService],
})
export class SpecialtyModule {}

