import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus } from '../enum';
import { PaginationQueryDto } from '../../common/dto';

export class QueryMyPaymentDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by start date (YYYY-MM-DD)',
    example: '2025-08-01',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Ngày bắt đầu không đúng định dạng' })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by end date (YYYY-MM-DD)',
    example: '2025-08-31',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Ngày kết thúc không đúng định dạng' })
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by payment status',
    enum: PaymentStatus,
    example: PaymentStatus.SUCCESS,
  })
  @IsOptional()
  @IsEnum(PaymentStatus, { message: 'Trạng thái thanh toán không hợp lệ' })
  status?: PaymentStatus;
}
