import { IsInt, IsOptional, IsString, MaxLength, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DoctorAwardDto {
  @ApiProperty({ description: 'Award title', example: 'National Clinical Excellence Award' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({ description: 'Issuing organization', example: 'Vietnam Medical Association' })
  @IsString()
  @MaxLength(255)
  organization: string;

  @ApiProperty({ description: 'Year received', example: 2021 })
  @IsInt()
  @Min(1950)
  @Max(new Date().getFullYear())
  year: number;

  @ApiPropertyOptional({ description: 'Award description' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}

