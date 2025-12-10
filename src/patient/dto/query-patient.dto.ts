import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto';

export class QueryPatientDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Search patients by name, email or phone',
    example: 'Nguyen',
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    description: 'Filter by gender',
    enum: Gender,
    example: Gender.MALE,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({
    description: 'Filter by blood type',
    example: 'O+',
  })
  @IsOptional()
  @IsString()
  bloodType?: string;
}
