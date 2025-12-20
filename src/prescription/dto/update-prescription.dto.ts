import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { CreatePrescriptionItemDto } from './create-prescription-item.dto';

export class UpdatePrescriptionDto {
  @ApiProperty({
    description: 'Danh sách thuốc kê đơn',
    type: [CreatePrescriptionItemDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePrescriptionItemDto)
  items: CreatePrescriptionItemDto[];
}
