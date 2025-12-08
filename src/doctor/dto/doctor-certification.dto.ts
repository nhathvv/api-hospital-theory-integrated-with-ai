import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsAfter } from '../../common/validators/date-after.validator';

export class DoctorCertificationDto {
  @ApiProperty({
    description: 'Certificate name',
    example: 'Medical Practice License',
  })
  @IsString()
  @MaxLength(255)
  certificateName: string;

  @ApiProperty({
    description: 'Issuing authority',
    example: 'Vietnam Ministry of Health',
  })
  @IsString()
  @MaxLength(255)
  issuingAuthority: string;

  @ApiProperty({ description: 'License number', example: 'HN-12345' })
  @IsString()
  @MaxLength(100)
  licenseNumber: string;

  @ApiProperty({ description: 'Issue date', example: '2015-06-01' })
  @IsDateString()
  issueDate: string;

  @ApiPropertyOptional({
    description: 'Expiry date (must be after issue date)',
    example: '2025-06-01',
  })
  @IsOptional()
  @IsDateString()
  @IsAfter('issueDate', { message: 'Expiry date must be after issue date' })
  expiryDate?: string;

  @ApiPropertyOptional({
    description: 'Document URL',
    example: '/uploads/certifications/doc-123.pdf',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  documentUrl?: string;
}
