import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum DocumentType {
  LAB_RESULT = 'LAB_RESULT',
  X_RAY = 'X_RAY',
  MRI = 'MRI',
  CT_SCAN = 'CT_SCAN',
  ULTRASOUND = 'ULTRASOUND',
  PRESCRIPTION = 'PRESCRIPTION',
  MEDICAL_REPORT = 'MEDICAL_REPORT',
  OTHER = 'OTHER',
}

export class UploadDocumentDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: Express.Multer.File;

  @ApiProperty({
    description: 'Tiêu đề tài liệu',
    example: 'Kết quả xét nghiệm máu',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Loại tài liệu',
    enum: DocumentType,
    example: DocumentType.LAB_RESULT,
  })
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @ApiPropertyOptional({
    description: 'Ghi chú',
    example: 'Kết quả xét nghiệm ngày 01/01/2026',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UploadAvatarDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: Express.Multer.File;
}

export class UploadResponseDto {
  @ApiProperty({ example: 'https://res.cloudinary.com/.../image.jpg' })
  url: string;

  @ApiProperty({ example: 'hospital/avatars/abc123' })
  publicId: string;

  @ApiProperty({ example: 'jpg' })
  format: string;

  @ApiPropertyOptional({ example: 800 })
  width?: number;

  @ApiPropertyOptional({ example: 600 })
  height?: number;

  @ApiProperty({ example: 102400 })
  bytes: number;
}

