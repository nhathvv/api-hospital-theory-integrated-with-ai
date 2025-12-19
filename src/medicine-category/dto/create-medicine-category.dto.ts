import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMedicineCategoryDto {
  @ApiProperty({
    description: 'Medicine category name',
    example: 'Kháng sinh',
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Medicine category code (uppercase, no spaces)',
    example: 'ANTIBIOTICS',
  })
  @IsString()
  @MaxLength(50)
  @Matches(/^[A-Z][A-Z0-9_]*$/, {
    message:
      'Code must be uppercase letters, numbers, and underscores only, starting with a letter',
  })
  code: string;

  @ApiPropertyOptional({
    description: 'Medicine category description',
    example: 'Thuốc kháng sinh dùng để điều trị nhiễm khuẩn',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Active status',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
