import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';
import { ConversationGateway } from './conversation.gateway';
import { PrismaModule } from '../prisma';
import { PatientModule } from '../patient';
import { EnvService } from '../configs/envs/env-service';

const envService = EnvService.getInstance();

@Module({
  imports: [
    PrismaModule,
    PatientModule,
    JwtModule.register({
      secret: envService.getJwtAccessSecret(),
    }),
  ],
  controllers: [ConversationController],
  providers: [ConversationService, ConversationGateway],
  exports: [ConversationService, ConversationGateway],
})
export class ConversationModule {}

