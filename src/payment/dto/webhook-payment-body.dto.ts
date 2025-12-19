import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class WebhookPaymentBodyDto {
  @ApiProperty({
    description: 'ID giao dịch trên SePay',
    example: 92704,
  })
  @IsInt()
  @Min(1)
  id: number;

  @ApiProperty({
    description: 'Tên ngân hàng (Brand name)',
    example: 'Vietcombank',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  gateway: string;

  @ApiProperty({
    description: 'Thời gian xảy ra giao dịch (định dạng: YYYY-MM-DD HH:mm:ss)',
    example: '2024-12-13 14:02:37',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/, {
    message: 'transactionDate phải có định dạng YYYY-MM-DD HH:mm:ss',
  })
  transactionDate: string;

  @ApiProperty({
    description: 'Số tài khoản ngân hàng',
    example: '0123499999',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  accountNumber: string;

  @ApiPropertyOptional({
    description: 'Mã code thanh toán (SePay tự nhận diện)',
    example: 'LH20241213001',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  code?: string | null;

  @ApiPropertyOptional({
    description: 'Nội dung chuyển khoản',
    example: 'NGUYEN VAN A thanh toan phi kham benh LH20241213001',
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({
    description: 'Loại giao dịch: in (tiền vào), out (tiền ra)',
    example: 'in',
    enum: ['in', 'out'],
  })
  @IsString()
  @IsIn(['in', 'out'], {
    message: 'transferType phải là "in" hoặc "out"',
  })
  transferType: 'in' | 'out';

  @ApiProperty({
    description: 'Số tiền giao dịch (VND)',
    example: 2277000,
  })
  @IsInt()
  @Min(0)
  transferAmount: number;

  @ApiPropertyOptional({
    description: 'Số dư tài khoản lũy kế (VND)',
    example: 19077000,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  accumulated?: number;

  @ApiPropertyOptional({
    description: 'Tài khoản ngân hàng phụ (tài khoản định danh)',
    example: null,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  subAccount?: string | null;

  @ApiPropertyOptional({
    description: 'Mã tham chiếu của tin nhắn SMS',
    example: 'MBVCB.3278907687',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  referenceCode?: string;

  @ApiPropertyOptional({
    description: 'Toàn bộ nội dung tin nhắn SMS',
    example: '',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
