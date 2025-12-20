import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, Min, IsUUID } from 'class-validator';

export class CreatePrescriptionItemDto {
  @ApiProperty({
    description: 'ID của lô thuốc',
    example: 'uuid-of-medicine-batch',
  })
  @IsUUID()
  medicineBatchId: string;

  @ApiProperty({ description: 'Số lượng', example: 10 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Liều dùng', example: '2 viên/ngày, sau ăn' })
  @IsString()
  dosage: string;

  @ApiPropertyOptional({ description: 'Hướng dẫn sử dụng' })
  @IsOptional()
  @IsString()
  instructions?: string;
}
