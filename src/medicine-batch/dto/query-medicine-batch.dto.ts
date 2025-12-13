import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BatchStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../common';

/**
 * Query DTO for MedicineBatch with pagination
 * Used for filtering and paginating medicine batches
 */
export class QueryMedicineBatchDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by medicine ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  medicineId?: string;

  @ApiPropertyOptional({
    description: 'Filter by category ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Filter by batch status',
    enum: BatchStatus,
    example: BatchStatus.IN_STOCK,
  })
  @IsOptional()
  @IsEnum(BatchStatus)
  status?: BatchStatus;

  @ApiPropertyOptional({
    description: 'Filter batches expiring before this date (ISO 8601)',
    example: '2025-12-31T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Ngày hết hạn không hợp lệ' })
  expiryDateBefore?: string;

  @ApiPropertyOptional({
    description: 'Filter batches expiring after this date (ISO 8601)',
    example: '2025-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Ngày hết hạn không hợp lệ' })
  expiryDateAfter?: string;
}
