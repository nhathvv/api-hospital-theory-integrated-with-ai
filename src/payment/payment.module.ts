import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { PaymentRepository } from './repository/payment.repository';
import { PrismaModule } from '../prisma';
import { PaymentService } from './payment.service';

@Module({
  imports: [PrismaModule],
  controllers: [WebhookController],
  providers: [PaymentService, PaymentRepository],
  exports: [PaymentService],
})
export class PaymentModule {}
