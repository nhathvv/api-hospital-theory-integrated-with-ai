import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsDateString,
  Min,
  Max,
  Matches,
  MaxLength,
} from 'class-validator';
import { Gender } from '@prisma/client';

export class UpdatePatientDto {
  @ApiPropertyOptional({ example: 'Nguyen Van A' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName?: string;

  @ApiPropertyOptional({ example: '0901234567' })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{10,11}$/, { message: 'Phone number must be 10-11 digits' })
  phone?: string;

  @ApiPropertyOptional({ example: '123 Nguyen Trai, District 1, HCMC' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ example: 170, description: 'Height in cm' })
  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(300)
  height?: number;

  @ApiPropertyOptional({ example: 65, description: 'Weight in kg' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(500)
  weight?: number;

  @ApiPropertyOptional({ example: 'O+', description: 'Blood type (A+, A-, B+, B-, AB+, AB-, O+, O-)' })
  @IsOptional()
  @IsString()
  @Matches(/^(A|B|AB|O)[+-]$/, { message: 'Invalid blood type format' })
  bloodType?: string;

  @ApiPropertyOptional({ example: 'Penicillin, Peanuts' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  allergies?: string;

  @ApiPropertyOptional({ example: '1990-01-15' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ enum: Gender, example: Gender.MALE })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ example: 'DN1234567890', description: 'Health insurance number (BHYT)' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  healthInsuranceNumber?: string;

  @ApiPropertyOptional({ example: '0987654321', description: 'Emergency contact phone number' })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{10,11}$/, { message: 'Emergency contact must be 10-11 digits' })
  emergencyContact?: string;
}
