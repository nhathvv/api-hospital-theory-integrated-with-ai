import { Module } from '@nestjs/common';
import { MedicineBatchService } from './medicine-batch.service';
import { PrismaModule } from '../prisma';

@Module({
  imports: [PrismaModule],
  providers: [MedicineBatchService],
  exports: [MedicineBatchService],
})
export class MedicineBatchModule {}
