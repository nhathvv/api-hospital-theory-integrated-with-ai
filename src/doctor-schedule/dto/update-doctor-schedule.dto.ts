import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DayOfWeek } from '@prisma/client';
import { TimeSlotDto } from './time-slot.dto';
import { IsAfter } from '../../common/validators/date-after.validator';

export class UpdateDoctorScheduleDto {
  @ApiPropertyOptional({
    description: 'Start date (YYYY-MM-DD)',
    example: '2025-02-03',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date (YYYY-MM-DD)',
    example: '2025-04-30',
  })
  @IsOptional()
  @IsDateString()
  @IsAfter('startDate', { message: 'endDate must be after startDate' })
  endDate?: string;

  @ApiPropertyOptional({
    enum: DayOfWeek,
    isArray: true,
    description:
      'Days of week (optional, will be extracted from timeSlots if not provided)',
    example: ['MONDAY', 'TUESDAY'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(DayOfWeek, { each: true })
  daysOfWeek?: DayOfWeek[];

  @ApiPropertyOptional({ description: 'Timezone', default: 'Asia/Ho_Chi_Minh' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ description: 'Schedule active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    type: [TimeSlotDto],
    description: 'Time slots (each slot must have dayOfWeek)',
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  timeSlots?: TimeSlotDto[];
}
