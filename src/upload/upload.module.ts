import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { CloudinaryService } from './cloudinary.service';
import { CloudinaryProvider } from './cloudinary.provider';
import { PrismaModule } from '../prisma';
import { BlockchainModule } from '../blockchain';

@Module({
  imports: [PrismaModule, BlockchainModule],
  controllers: [UploadController],
  providers: [CloudinaryProvider, CloudinaryService, UploadService],
  exports: [CloudinaryService, UploadService],
})
export class UploadModule {}

