import { Module } from '@nestjs/common';
import { AIRecommendationController } from './ai-recommendation.controller';
import { AIRecommendationService } from './ai-recommendation.service';
import { GeminiService } from './gemini/gemini.service';
import { PrismaModule } from '../prisma';

@Module({
  imports: [PrismaModule],
  controllers: [AIRecommendationController],
  providers: [AIRecommendationService, GeminiService],
  exports: [AIRecommendationService, GeminiService],
})
export class AIRecommendationModule {}

