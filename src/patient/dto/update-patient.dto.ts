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
  @ApiPropertyOptional({ example: 'Nguyễn Văn A' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName?: string;

  @ApiPropertyOptional({ example: '0901234567' })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{10,11}$/, { message: 'Số điện thoại phải có 10–11 chữ số' })
  phone?: string;

  @ApiPropertyOptional({ example: '123 Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({ example: 'https://example.com/anh-dai-dien.jpg' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ example: 170, description: 'Chiều cao (cm)' })
  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(300)
  height?: number;

  @ApiPropertyOptional({ example: 65, description: 'Cân nặng (kg)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(500)
  weight?: number;

  @ApiPropertyOptional({
    example: 'O+',
    description: 'Nhóm máu (A+, A-, B+, B-, AB+, AB-, O+, O-)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^(A|B|AB|O)[+-]$/, { message: 'Nhóm máu không hợp lệ' })
  bloodType?: string;

  @ApiPropertyOptional({ example: 'Dị ứng penicillin, đậu phộng' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  allergies?: string;

  @ApiPropertyOptional({ example: '1990-01-15', description: 'Ngày sinh' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({
    enum: Gender,
    example: Gender.MALE,
    description: 'Giới tính',
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({
    example: 'DN1234567890',
    description: 'Mã số bảo hiểm y tế (BHYT)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  healthInsuranceNumber?: string;

  @ApiPropertyOptional({
    example: '0987654321',
    description: 'Số điện thoại liên hệ khẩn cấp',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{10,11}$/, {
    message: 'Số liên hệ khẩn cấp phải có 10–11 chữ số',
  })
  emergencyContact?: string;

  @ApiPropertyOptional({
    example: '012345678901',
    description: 'Số CMND/CCCD',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{9,12}$/, { message: 'CMND/CCCD phải có 9–12 chữ số' })
  identityNumber?: string;

  @ApiPropertyOptional({
    example: 'Cao huyết áp, tiểu đường',
    description: 'Bệnh mãn tính',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  chronicDisease?: string;
}
