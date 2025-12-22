import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto';
import { ConversationStatus, ConversationPriority } from '@prisma/client';

export class QueryConversationDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Lọc theo trạng thái',
    enum: ConversationStatus,
  })
  @IsOptional()
  @IsEnum(ConversationStatus)
  status?: ConversationStatus;

  @ApiPropertyOptional({
    description: 'Lọc theo độ ưu tiên',
    enum: ConversationPriority,
  })
  @IsOptional()
  @IsEnum(ConversationPriority)
  priority?: ConversationPriority;

  @ApiPropertyOptional({
    description: 'Lọc theo admin được gán',
  })
  @IsOptional()
  @IsUUID()
  assignedAdminId?: string;

  @ApiPropertyOptional({
    description: 'Tìm kiếm theo tên hoặc email bệnh nhân',
  })
  @IsOptional()
  @IsString()
  patientSearch?: string;
}

export class QueryMessageDto extends PaginationQueryDto {}

