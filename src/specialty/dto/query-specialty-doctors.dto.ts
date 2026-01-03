import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common';

export class QuerySpecialtyDoctorsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by doctor name' })
  @IsOptional()
  @IsString()
  name?: string;
}

