import { Module } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { PaymentBlockchainService } from './payment-blockchain.service';
import { BlockchainController } from './blockchain.controller';
import { PrismaModule } from '../prisma';

@Module({
  imports: [PrismaModule],
  controllers: [BlockchainController],
  providers: [BlockchainService, PaymentBlockchainService],
  exports: [BlockchainService, PaymentBlockchainService],
})
export class BlockchainModule {}

