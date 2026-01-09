import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { JwtModule } from '@nestjs/jwt';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { CloudinaryService } from './cloudinary.service';
import { CloudinaryProvider } from './cloudinary.provider';
import { UploadProcessor } from './upload.processor';
import { UploadGateway } from './upload.gateway';
import { UPLOAD_QUEUE_NAME } from './upload.queue';
import { PrismaModule } from '../prisma';
import { BlockchainModule } from '../blockchain';
import { EnvService } from '../configs/envs/env-service';

const envService = EnvService.getInstance();

@Module({
  imports: [
    PrismaModule,
    BlockchainModule,
    BullModule.registerQueue({
      name: UPLOAD_QUEUE_NAME,
    }),
    JwtModule.register({
      secret: envService.getJwtAccessSecret(),
    }),
  ],
  controllers: [UploadController],
  providers: [
    CloudinaryProvider,
    CloudinaryService,
    UploadService,
    UploadProcessor,
    UploadGateway,
  ],
  exports: [CloudinaryService, UploadService],
})
export class UploadModule {}

