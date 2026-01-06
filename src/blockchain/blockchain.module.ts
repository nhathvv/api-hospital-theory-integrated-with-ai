import { Module } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { PaymentBlockchainService } from './payment-blockchain.service';
import { MedicalRecordBlockchainService } from './medical-record-blockchain.service';
import { BlockchainController } from './blockchain.controller';
import { PrismaModule } from '../prisma';

@Module({
  imports: [PrismaModule],
  controllers: [BlockchainController],
  providers: [
    BlockchainService,
    PaymentBlockchainService,
    MedicalRecordBlockchainService,
  ],
  exports: [
    BlockchainService,
    PaymentBlockchainService,
    MedicalRecordBlockchainService,
  ],
})
export class BlockchainModule {}

