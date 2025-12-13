import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BatchStatus } from '@prisma/client';

export class CreateMedicineBatchDto {
  @ApiPropertyOptional({
    description: 'Mã nhóm thuốc',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({
    description: 'Mã thuốc',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  medicineId: string;

  @ApiProperty({
    description: 'Số lô (định dạng: AAA-MMYY-NN, ví dụ: PARA-0825-01)',
    example: 'PARA-0825-01',
  })
  @IsString()
  @MaxLength(50)
  @Matches(/^[A-Z0-9]+-\d{4}-\d{2}$/, {
    message: 'Số lô phải có định dạng AAA-MMYY-NN (ví dụ: PARA-0825-01)',
  })
  batchNumber: string;

  @ApiProperty({
    description: 'Số lượng nhập',
    example: 1000,
  })
  @IsInt()
  @Min(1, { message: 'Số lượng phải lớn hơn 0' })
  quantity: number;

  @ApiProperty({
    description: 'Giá nhập (VND)',
    example: 5000,
  })
  @IsInt()
  @Min(0, { message: 'Giá nhập phải lớn hơn hoặc bằng 0' })
  unitPrice: number;

  @ApiProperty({
    description: 'Giá bán (VND)',
    example: 7000,
  })
  @IsInt()
  @Min(0, { message: 'Giá bán phải lớn hơn hoặc bằng 0' })
  sellingPrice: number;

  @ApiPropertyOptional({
    description: 'Ngày sản xuất (ISO 8601)',
    example: '2025-08-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Ngày sản xuất không hợp lệ' })
  manufactureDate?: string;

  @ApiProperty({
    description: 'Hạn sử dụng (ISO 8601)',
    example: '2027-08-01T00:00:00.000Z',
  })
  @IsDateString({}, { message: 'Hạn sử dụng không hợp lệ' })
  expiryDate: string;

  @ApiPropertyOptional({
    description: 'Nhà sản xuất',
    example: 'Công ty Dược Hậu Giang',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  manufacturer?: string;

  @ApiPropertyOptional({
    description: 'Nhà cung cấp',
    example: 'Công ty TNHH Dược phẩm ABC',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  supplier?: string;

  @ApiPropertyOptional({
    description: 'Trạng thái lô thuốc',
    enum: BatchStatus,
    default: BatchStatus.IN_STOCK,
    example: BatchStatus.IN_STOCK,
  })
  @IsOptional()
  @IsEnum(BatchStatus)
  status?: BatchStatus;

  @ApiPropertyOptional({
    description: 'Ghi chú',
    example: 'Lô thuốc nhập từ nhà cung cấp ABC',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
