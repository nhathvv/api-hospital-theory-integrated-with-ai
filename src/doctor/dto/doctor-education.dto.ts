import { IsInt, IsString, MaxLength, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DoctorEducationDto {
  @ApiProperty({
    description: 'School name',
    example: 'University of Medicine and Pharmacy',
  })
  @IsString()
  @MaxLength(255)
  school: string;

  @ApiProperty({ description: 'Degree obtained', example: 'MD, Cardiology' })
  @IsString()
  @MaxLength(255)
  degree: string;

  @ApiProperty({ description: 'Graduation year', example: 2015 })
  @IsInt()
  @Min(1950)
  @Max(new Date().getFullYear())
  graduationYear: number;
}
