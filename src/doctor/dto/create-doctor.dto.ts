import {
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DoctorEducationDto } from './doctor-education.dto';
import { DoctorAwardDto } from './doctor-award.dto';
import { DoctorCertificationDto } from './doctor-certification.dto';
import { DoctorStatus } from '@prisma/client';

export class CreateDoctorDto {
  @ApiProperty({ description: 'Email address', example: 'doctor@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Username (for login)', example: 'dr.john' })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  username: string;

  @ApiProperty({ description: 'Phone number', example: '+84123456789' })
  @IsString()
  @MaxLength(20)
  phone: string;

  @ApiProperty({ description: 'Full name', example: 'Dr. John Doe' })
  @IsString()
  @MaxLength(255)
  fullName: string;

  @ApiPropertyOptional({
    description: 'Avatar URL',
    example: '/uploads/avatars/doctor-123.jpg',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatar?: string;

  @ApiPropertyOptional({ description: 'Address' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiProperty({ description: 'Primary specialty ID' })
  @IsUUID()
  primarySpecialtyId: string;

  @ApiPropertyOptional({
    description: 'Sub-specialty',
    example: 'Interventional Cardiology',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subSpecialty?: string;

  @ApiPropertyOptional({
    description: 'Professional title',
    example: 'Associate Professor',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  professionalTitle?: string;

  @ApiProperty({ description: 'Years of experience', example: 10 })
  @IsInt()
  @Min(0)
  yearsOfExperience: number;

  @ApiProperty({ description: 'Consultation fee in VND', example: 500000 })
  @IsNumber()
  @Min(0)
  consultationFee: number;

  @ApiPropertyOptional({ description: 'Biography' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @ApiProperty({ description: 'Education history', type: [DoctorEducationDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DoctorEducationDto)
  educations: DoctorEducationDto[];

  @ApiPropertyOptional({ description: 'Awards', type: [DoctorAwardDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DoctorAwardDto)
  awards?: DoctorAwardDto[];

  @ApiProperty({
    description: 'Certifications',
    type: [DoctorCertificationDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DoctorCertificationDto)
  certifications: DoctorCertificationDto[];

  @ApiPropertyOptional({
    description: 'Doctor status',
    enum: DoctorStatus,
    default: 'ACTIVE',
  })
  @IsOptional()
  @IsEnum(DoctorStatus)
  status?: DoctorStatus;
}
