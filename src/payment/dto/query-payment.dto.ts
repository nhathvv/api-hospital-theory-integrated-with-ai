import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, PaymentStatus } from '../enum';
import { PaginationQueryDto } from '../../common/dto';

export class QueryPaymentDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Search by payment code (Transaction ID)',
    example: 'TX-2025-0812-0012',
  })
  @IsOptional()
  @IsString()
  paymentCode?: string;

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
    description: 'Filter by doctor ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Mã bác sĩ không hợp lệ' })
  doctorId?: string;

  @ApiPropertyOptional({
    description: 'Search by patient name or phone',
    example: 'Nguyen Van A',
  })
  @IsOptional()
  @IsString()
  patientSearch?: string;

  @ApiPropertyOptional({
    description: 'Filter by payment status',
    enum: PaymentStatus,
    example: PaymentStatus.SUCCESS,
  })
  @IsOptional()
  @IsEnum(PaymentStatus, { message: 'Trạng thái thanh toán không hợp lệ' })
  status?: PaymentStatus;

  @ApiPropertyOptional({
    description: 'Filter by payment method',
    enum: PaymentMethod,
    example: PaymentMethod.BANK_TRANSFER,
  })
  @IsOptional()
  @IsEnum(PaymentMethod, { message: 'Phương thức thanh toán không hợp lệ' })
  method?: PaymentMethod;
}
