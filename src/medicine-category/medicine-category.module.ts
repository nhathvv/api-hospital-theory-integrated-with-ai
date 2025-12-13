import { Module } from '@nestjs/common';
import { MedicineCategoryService } from './medicine-category.service';
import { PrismaModule } from '../prisma';

@Module({
  imports: [PrismaModule],
  providers: [MedicineCategoryService],
  exports: [MedicineCategoryService],
})
export class MedicineCategoryModule {}
