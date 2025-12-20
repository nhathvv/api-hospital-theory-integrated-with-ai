import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto';

export class QueryMyPatientsDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Tìm kiếm bệnh nhân theo tên, email hoặc số điện thoại',
    example: 'Nguyen',
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    description: 'Lọc theo trạng thái lịch hẹn',
    enum: AppointmentStatus,
    example: AppointmentStatus.COMPLETED,
  })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  appointmentStatus?: AppointmentStatus;
}
