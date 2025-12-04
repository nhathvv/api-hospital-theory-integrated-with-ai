import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DoctorStatus } from '@prisma/client';

export class UserBasicInfo {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional()
  username?: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  fullName?: string;

  @ApiPropertyOptional()
  avatar?: string;

  @ApiPropertyOptional()
  address?: string;

  @ApiProperty()
  role: string;
}

export class SpecialtyInfo {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  isActive: boolean;
}

export class DoctorResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ type: UserBasicInfo })
  user: UserBasicInfo;

  @ApiProperty()
  primarySpecialtyId: string;

  @ApiProperty({ type: SpecialtyInfo })
  primarySpecialty: SpecialtyInfo;

  @ApiPropertyOptional()
  subSpecialty?: string;

  @ApiPropertyOptional()
  professionalTitle?: string;

  @ApiProperty()
  yearsOfExperience: number;

  @ApiProperty()
  consultationFee: number;

  @ApiPropertyOptional()
  bio?: string;

  @ApiProperty({ enum: DoctorStatus })
  status: DoctorStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

