import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageType } from '@prisma/client';

export class CreateMessageDto {
  @ApiProperty({
    description: 'Nội dung tin nhắn',
    example: 'Xin chào, tôi cần hỗ trợ',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(5000)
  content: string;

  @ApiPropertyOptional({
    description: 'Loại tin nhắn',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  @IsOptional()
  @IsEnum(MessageType)
  messageType?: MessageType;

  @ApiPropertyOptional({
    description: 'URL file đính kèm',
    example: 'https://example.com/file.pdf',
  })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}

