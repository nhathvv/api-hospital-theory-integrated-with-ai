import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { WebhookController } from './webhook.controller';
import { PaymentRepository } from './repository/payment.repository';
import { PrismaModule } from '../prisma';
import { PaymentService } from './payment.service';
import { PaymentGateway } from './payment.gateway';
import { BlockchainModule } from '../blockchain';
import { EnvService } from '../configs/envs/env-service';

const envService = EnvService.getInstance();

@Module({
  imports: [
    PrismaModule,
    BlockchainModule,
    JwtModule.register({
      secret: envService.getJwtAccessSecret(),
    }),
  ],
  controllers: [WebhookController],
  providers: [PaymentService, PaymentRepository, PaymentGateway],
  exports: [PaymentService],
})
export class PaymentModule {}
