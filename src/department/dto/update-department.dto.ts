import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDepartmentDto {
  @ApiPropertyOptional({ description: 'Department name', example: 'Cardiology' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Department code', example: 'CARD-001' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({ description: 'Department description', example: 'Heart and cardiovascular system department' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ description: 'Head doctor ID (UUID)' })
  @IsOptional()
  @IsUUID()
  headId?: string;

  @ApiPropertyOptional({ description: 'Department active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
