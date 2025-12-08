import { IsEnum, IsInt, IsString, Matches, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DayOfWeek, ExaminationType } from '@prisma/client';

export class TimeSlotDto {
  @ApiProperty({
    description: 'Day of the week',
    enum: DayOfWeek,
    example: DayOfWeek.MONDAY,
  })
  @IsEnum(DayOfWeek)
  dayOfWeek: DayOfWeek;

  @ApiProperty({
    description: 'Start time in HH:mm format',
    example: '08:00',
  })
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime must be in HH:mm format',
  })
  startTime: string;

  @ApiProperty({
    description: 'End time in HH:mm format',
    example: '12:00',
  })
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'endTime must be in HH:mm format',
  })
  endTime: string;

  @ApiProperty({
    description: 'Type of examination',
    enum: ExaminationType,
    example: ExaminationType.IN_PERSON,
  })
  @IsEnum(ExaminationType)
  examinationType: ExaminationType;

  @ApiProperty({
    description: 'Maximum number of patients for this slot',
    example: 12,
    minimum: 1,
    maximum: 100,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  maxPatients: number;
}
