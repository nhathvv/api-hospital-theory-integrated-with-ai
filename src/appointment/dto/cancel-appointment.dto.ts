import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CancellationReason } from '@prisma/client';

export class CancelAppointmentDto {
  @ApiProperty({
    description: 'Lý do hủy lịch hẹn',
    enum: CancellationReason,
    example: CancellationReason.PATIENT_REQUEST,
  })
  @IsEnum(CancellationReason, {
    message: 'Lý do hủy không hợp lệ',
  })
  reason: CancellationReason;

  @ApiPropertyOptional({
    description: 'Ghi chú thêm khi hủy lịch hẹn',
    example: 'Tôi có việc bận đột xuất',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Ghi chú không được vượt quá 500 ký tự' })
  note?: string;
}
