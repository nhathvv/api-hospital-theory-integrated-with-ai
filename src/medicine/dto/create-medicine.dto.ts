import {
  IsBoolean,
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
import { MedicineUnit } from '@prisma/client';

export class CreateMedicineDto {
  @ApiProperty({
    description: 'Tên thuốc',
    example: 'Paracetamol 500mg',
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Mã thuốc (chữ in hoa, không có dấu cách)',
    example: 'PARA500',
  })
  @IsString()
  @MaxLength(50)
  @Matches(/^[A-Z][A-Z0-9_]*$/, {
    message:
      'Mã thuốc phải là chữ in hoa, số và dấu gạch dưới, bắt đầu bằng chữ cái',
  })
  code: string;

  @ApiPropertyOptional({
    description: 'Hoạt chất',
    example: 'Paracetamol',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  activeIngredient?: string;

  @ApiPropertyOptional({
    description: 'Mô tả / Công dụng',
    example: 'Giảm đau, hạ sốt',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: 'Đơn vị tính',
    enum: MedicineUnit,
    example: MedicineUnit.TABLET,
  })
  @IsEnum(MedicineUnit)
  unit: MedicineUnit;

  @ApiPropertyOptional({
    description: 'Hàm lượng',
    example: '500mg',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  dosage?: string;

  @ApiPropertyOptional({
    description: 'Nhà sản xuất',
    example: 'Công ty Dược Hậu Giang',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  manufacturer?: string;

  @ApiPropertyOptional({
    description: 'Mã nhóm thuốc',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Ngưỡng cảnh báo sắp hết hàng',
    default: 100,
    example: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;

  @ApiPropertyOptional({
    description: 'Thuốc kê đơn',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  requiresPrescription?: boolean;

  @ApiPropertyOptional({
    description: 'Trạng thái hoạt động',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
