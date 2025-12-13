import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { ExaminationType } from '@prisma/client';

/**
 * DTO tạo lịch hẹn khám bệnh
 * Sử dụng cho endpoint POST /api/appointments
 */
export class CreateAppointmentDto {
  @ApiProperty({
    description: 'Mã bác sĩ',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty({ message: 'Mã bác sĩ không được để trống' })
  @IsUUID('4', { message: 'Mã bác sĩ không hợp lệ' })
  doctorId: string;

  @ApiProperty({
    description: 'Mã khung giờ khám',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsNotEmpty({ message: 'Mã khung giờ không được để trống' })
  @IsUUID('4', { message: 'Mã khung giờ không hợp lệ' })
  timeSlotId: string;

  @ApiProperty({
    description: 'Ngày hẹn khám (định dạng YYYY-MM-DD)',
    example: '2024-12-16',
  })
  @IsNotEmpty({ message: 'Ngày hẹn khám không được để trống' })
  @IsDateString({}, { message: 'Ngày hẹn khám không đúng định dạng' })
  appointmentDate: string;

  @ApiProperty({
    description: 'Loại hình khám (trực tiếp hoặc online)',
    enum: ExaminationType,
    example: ExaminationType.IN_PERSON,
  })
  @IsNotEmpty({ message: 'Loại hình khám không được để trống' })
  @IsEnum(ExaminationType, { message: 'Loại hình khám không hợp lệ' })
  examinationType: ExaminationType;

  @ApiProperty({
    description: 'Mô tả triệu chứng bệnh (tối thiểu 10 ký tự)',
    example: 'Đau bụng, buồn nôn 2 ngày',
  })
  @IsNotEmpty({ message: 'Triệu chứng không được để trống' })
  @IsString({ message: 'Triệu chứng phải là chuỗi ký tự' })
  @MinLength(10, { message: 'Triệu chứng phải có ít nhất 10 ký tự' })
  @MaxLength(1000, { message: 'Triệu chứng không được vượt quá 1000 ký tự' })
  symptoms: string;

  @ApiPropertyOptional({
    description: 'Ghi chú thêm của bệnh nhân (tiền sử bệnh, dị ứng, ...)',
    example: 'Có tiền sử dị ứng Penicillin',
  })
  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi ký tự' })
  @MaxLength(500, { message: 'Ghi chú không được vượt quá 500 ký tự' })
  notes?: string;
}
