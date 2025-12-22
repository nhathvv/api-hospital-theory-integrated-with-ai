import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ConversationStatus, ConversationPriority } from '@prisma/client';

export class UpdateConversationDto {
  @ApiPropertyOptional({
    description: 'Chủ đề cuộc hội thoại',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subject?: string;

  @ApiPropertyOptional({
    description: 'Trạng thái cuộc hội thoại',
    enum: ConversationStatus,
  })
  @IsOptional()
  @IsEnum(ConversationStatus)
  status?: ConversationStatus;

  @ApiPropertyOptional({
    description: 'Độ ưu tiên cuộc hội thoại',
    enum: ConversationPriority,
  })
  @IsOptional()
  @IsEnum(ConversationPriority)
  priority?: ConversationPriority;

  @ApiPropertyOptional({
    description: 'ID admin được gán xử lý',
  })
  @IsOptional()
  @IsUUID()
  assignedAdminId?: string;
}

export class CloseConversationDto {
  @ApiPropertyOptional({
    description: 'Ghi chú khi đóng cuộc hội thoại',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

