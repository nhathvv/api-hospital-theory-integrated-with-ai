import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common';

export class QueryDoctorScheduleDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by doctor ID' })
  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @ApiPropertyOptional({ description: 'Filter start date from (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter start date to (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDateTo?: string;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}

export class QueryAvailableSlotsDto {
  @ApiPropertyOptional({
    description: 'Date to get available slots (YYYY-MM-DD)',
    example: '2025-02-03',
  })
  @IsOptional()
  @IsDateString()
  date?: string;
}
