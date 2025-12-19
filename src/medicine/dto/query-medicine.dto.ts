import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MedicineUnit } from '@prisma/client';

/**
 * Query DTO for Medicine (without pagination)
 * Used for filtering medicines
 */
export class QueryMedicineDto {
  @ApiPropertyOptional({
    description: 'Search by name, code, or active ingredient',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Filter by medicine unit',
    enum: MedicineUnit,
  })
  @IsOptional()
  @IsEnum(MedicineUnit)
  unit?: MedicineUnit;

  @ApiPropertyOptional({ description: 'Filter by prescription requirement' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  requiresPrescription?: boolean;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
