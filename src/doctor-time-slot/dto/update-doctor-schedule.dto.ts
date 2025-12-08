import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsBoolean,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DayOfWeek } from '@prisma/client';
import { TimeSlotDto } from './time-slot.dto';
import { IsAfter } from '../../common/validators/date-after.validator';

export class UpdateDoctorScheduleDto {
  @ApiPropertyOptional({
    description: 'Start date of the schedule (YYYY-MM-DD)',
    example: '2025-02-03',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date of the schedule (YYYY-MM-DD)',
    example: '2025-04-30',
  })
  @IsOptional()
  @IsDateString()
  @IsAfter('startDate', { message: 'End date must be after start date' })
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Days of week to apply this schedule',
    enum: DayOfWeek,
    isArray: true,
    example: [DayOfWeek.MONDAY, DayOfWeek.TUESDAY],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(DayOfWeek, { each: true })
  daysOfWeek?: DayOfWeek[];

  @ApiPropertyOptional({
    description: 'Timezone (IANA timezone)',
    example: 'Asia/Ho_Chi_Minh',
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Active status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Time slots for each selected day',
    type: [TimeSlotDto],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  timeSlots?: TimeSlotDto[];
}
