import { Module } from '@nestjs/common';
import { DepartmentService } from './department.service';
import { PrismaModule } from '../prisma';

@Module({
  imports: [PrismaModule],
  providers: [DepartmentService],
  exports: [DepartmentService],
})
export class DepartmentModule {}
