import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  IsArray,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PatientInfoDto {
  @ApiPropertyOptional({ example: 35, description: 'Tuổi bệnh nhân' })
  @IsOptional()
  @IsNumber()
  age?: number;

  @ApiPropertyOptional({
    enum: ['MALE', 'FEMALE', 'OTHER'],
    example: 'MALE',
    description: 'Giới tính',
  })
  @IsOptional()
  @IsEnum(['MALE', 'FEMALE', 'OTHER'])
  gender?: 'MALE' | 'FEMALE' | 'OTHER';

  @ApiPropertyOptional({
    type: [String],
    example: ['Tăng huyết áp', 'Tiểu đường'],
    description: 'Tiền sử bệnh',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  medicalHistory?: string[];
}

export class SymptomInputDto {
  @ApiProperty({
    example: 'Tôi bị đau đầu liên tục 3 ngày nay, kèm theo chóng mặt và buồn nôn',
    description: 'Mô tả triệu chứng của bệnh nhân',
  })
  @IsString()
  @IsNotEmpty()
  symptoms: string;

  @ApiPropertyOptional({
    type: PatientInfoDto,
    description: 'Thông tin bệnh nhân',
  })
  @IsOptional()
  @Type(() => PatientInfoDto)
  patientInfo?: PatientInfoDto;

  @ApiPropertyOptional({
    example: '2026-01-10',
    description: 'Ngày mong muốn khám',
  })
  @IsOptional()
  @IsDateString()
  preferredDate?: string;

  @ApiPropertyOptional({
    enum: ['IN_PERSON', 'ONLINE'],
    example: 'IN_PERSON',
    description: 'Hình thức khám',
  })
  @IsOptional()
  @IsEnum(['IN_PERSON', 'ONLINE'])
  examinationType?: 'IN_PERSON' | 'ONLINE';
}

export class ChatMessageDto {
  @ApiProperty({
    example: 'Tôi bị đau bụng',
    description: 'Tin nhắn từ bệnh nhân',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    type: [Object],
    description: 'Lịch sử hội thoại',
  })
  @IsOptional()
  @IsArray()
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[];
}

