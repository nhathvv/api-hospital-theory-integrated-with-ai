import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateConversationDto {
  @ApiPropertyOptional({
    description: 'Chủ đề cuộc hội thoại',
    example: 'Hỏi về lịch hẹn khám',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subject?: string;

  @ApiPropertyOptional({
    description: 'Nội dung tin nhắn đầu tiên',
    example: 'Xin chào, tôi muốn hỏi về lịch hẹn khám',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  initialMessage?: string;
}

