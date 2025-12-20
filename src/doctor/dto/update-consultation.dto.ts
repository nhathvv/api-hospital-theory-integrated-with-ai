import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, MaxLength } from 'class-validator';
import { AppointmentStatus } from '@prisma/client';

const ALLOWED_STATUSES = [
  AppointmentStatus.IN_PROGRESS,
  AppointmentStatus.COMPLETED,
] as const;

export class UpdateConsultationDto {
  @ApiProperty({
    description: 'Chẩn đoán của bác sĩ',
    example: 'Viêm họng cấp, nhiễm virus đường hô hấp trên',
  })
  @IsString()
  @MaxLength(2000)
  diagnosis: string;

  @ApiPropertyOptional({
    description: 'Đơn thuốc kê cho bệnh nhân',
    example:
      'Paracetamol 500mg x 2 viên/ngày (sau ăn)\nAmoxicillin 500mg x 3 viên/ngày (sau ăn)\nVitamin C 1000mg x 1 viên/ngày',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  prescription?: string;

  @ApiPropertyOptional({
    description: 'Ghi chú thêm của bác sĩ',
    example: 'Nghỉ ngơi, uống nhiều nước, tái khám sau 3 ngày nếu không đỡ',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({
    description: 'Trạng thái lịch hẹn sau khi cập nhật',
    enum: ALLOWED_STATUSES,
    example: AppointmentStatus.COMPLETED,
  })
  @IsOptional()
  @IsIn(ALLOWED_STATUSES, {
    message: 'Status phải là IN_PROGRESS hoặc COMPLETED',
  })
  status?: AppointmentStatus;
}
