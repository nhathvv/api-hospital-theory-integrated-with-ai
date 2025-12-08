import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';
import { DayOfWeek, ExaminationType } from '@prisma/client';

export class TimeSlotDto {
  @ApiProperty({ enum: DayOfWeek, description: 'Day of week', example: 'MONDAY' })
  @IsEnum(DayOfWeek)
  dayOfWeek: DayOfWeek;

  @ApiProperty({ description: 'Start time (HH:mm)', example: '08:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'startTime must be in HH:mm format' })
  startTime: string;

  @ApiProperty({ description: 'End time (HH:mm)', example: '12:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'endTime must be in HH:mm format' })
  endTime: string;

  @ApiPropertyOptional({ enum: ExaminationType, description: 'Examination type', default: 'IN_PERSON' })
  @IsOptional()
  @IsEnum(ExaminationType)
  examinationType?: ExaminationType;

  @ApiPropertyOptional({ description: 'Maximum patients per slot', default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  maxPatients?: number;
}
