import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DoctorStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto';

export class QueryDoctorDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Search doctors by name (full name)',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Filter by specialty ID',
    example: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  })
  @IsOptional()
  @IsString()
  specialtyId?: string;

  @ApiPropertyOptional({
    description: 'Filter by doctor status',
    enum: DoctorStatus,
    example: DoctorStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(DoctorStatus)
  status?: DoctorStatus;
}
