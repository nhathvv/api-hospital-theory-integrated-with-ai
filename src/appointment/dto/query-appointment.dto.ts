import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto';

export class QueryAppointmentDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Search by patient name, phone or email',
    example: 'Nguyen Van A',
  })
  @IsOptional()
  @IsString()
  patientSearch?: string;

  @ApiPropertyOptional({
    description: 'Filter by start date (YYYY-MM-DD)',
    example: '2024-12-01',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Ngày bắt đầu không đúng định dạng' })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by end date (YYYY-MM-DD)',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Ngày kết thúc không đúng định dạng' })
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by doctor ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Mã bác sĩ không hợp lệ' })
  doctorId?: string;

  @ApiPropertyOptional({
    description: 'Filter by appointment status',
    enum: AppointmentStatus,
    example: AppointmentStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(AppointmentStatus, { message: 'Trạng thái không hợp lệ' })
  status?: AppointmentStatus;
}
