import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DayOfWeek } from '@prisma/client';
import { TimeSlotDto } from './time-slot.dto';
import { IsAfter } from '../../common/validators/date-after.validator';

export class CreateDoctorScheduleDto {
  @ApiProperty({
    description: 'Doctor ID',
    example: 'uuid-doctor-id',
  })
  @IsUUID()
  doctorId: string;

  @ApiProperty({
    description: 'Start date of the schedule (YYYY-MM-DD)',
    example: '2025-02-03',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'End date of the schedule (YYYY-MM-DD)',
    example: '2025-04-30',
  })
  @IsDateString()
  @IsAfter('startDate', { message: 'End date must be after start date' })
  endDate: string;

  @ApiProperty({
    description: 'Days of week to apply this schedule',
    enum: DayOfWeek,
    isArray: true,
    example: [DayOfWeek.MONDAY, DayOfWeek.TUESDAY],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(DayOfWeek, { each: true })
  daysOfWeek: DayOfWeek[];

  @ApiPropertyOptional({
    description: 'Timezone (IANA timezone)',
    example: 'Asia/Ho_Chi_Minh',
    default: 'Asia/Ho_Chi_Minh',
  })
  @IsOptional()
  @IsString()
  timezone?: string = 'Asia/Ho_Chi_Minh';

  @ApiProperty({
    description: 'Time slots for each selected day',
    type: [TimeSlotDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  timeSlots: TimeSlotDto[];
}
