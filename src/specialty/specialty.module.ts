import { Module } from '@nestjs/common';
import { SpecialtyController } from './specialty.controller';
import { SpecialtyService } from './specialty.service';
import { PrismaModule } from '../prisma';

@Module({
  imports: [PrismaModule],
  controllers: [SpecialtyController],
  providers: [SpecialtyService],
  exports: [SpecialtyService],
})
export class SpecialtyModule {}

