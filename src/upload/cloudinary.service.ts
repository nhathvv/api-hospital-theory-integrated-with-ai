import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';
import * as crypto from 'crypto';

export enum UploadFolder {
  AVATARS = 'hospital/avatars',
  MEDICAL_DOCUMENTS = 'hospital/medical-documents',
  CERTIFICATIONS = 'hospital/certifications',
  ATTACHMENTS = 'hospital/attachments',
}

export interface UploadResult {
  url: string;
  publicId: string;
  format: string;
  width?: number;
  height?: number;
  bytes: number;
  fileContentHash: string;
}

@Injectable()
export class CloudinaryService {
  private readonly allowedImageTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ];
  private readonly allowedDocumentTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  private readonly maxImageSize = 5 * 1024 * 1024;
  private readonly maxDocumentSize = 10 * 1024 * 1024;

  async uploadImage(
    file: Express.Multer.File,
    folder: UploadFolder = UploadFolder.AVATARS,
  ): Promise<UploadResult> {
    this.validateFile(file, this.allowedImageTypes, this.maxImageSize);
    return this.upload(file, folder, 'image');
  }

  async uploadDocument(
    file: Express.Multer.File,
    folder: UploadFolder = UploadFolder.MEDICAL_DOCUMENTS,
  ): Promise<UploadResult> {
    this.validateFile(file, this.allowedDocumentTypes, this.maxDocumentSize);
    const isPdf = file.mimetype === 'application/pdf';
    const isWord =
      file.mimetype === 'application/msword' ||
      file.mimetype ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const resourceType = isPdf || isWord ? 'raw' : 'auto';
    return this.upload(file, folder, resourceType);
  }

  async uploadMultipleDocuments(
    files: Express.Multer.File[],
    folder: UploadFolder = UploadFolder.MEDICAL_DOCUMENTS,
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map((file) =>
      this.uploadDocument(file, folder),
    );
    return Promise.all(uploadPromises);
  }

  async deleteFile(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch {
      return false;
    }
  }

  async deleteMultipleFiles(publicIds: string[]): Promise<void> {
    await Promise.all(publicIds.map((id) => this.deleteFile(id)));
  }

  private validateFile(
    file: Express.Multer.File,
    allowedTypes: string[],
    maxSize: number,
  ): void {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed: ${allowedTypes.join(', ')}`,
      );
    }

    if (file.size > maxSize) {
      throw new BadRequestException(
        `File too large. Max size: ${maxSize / (1024 * 1024)}MB`,
      );
    }
  }

  private async upload(
    file: Express.Multer.File,
    folder: string,
    resourceType: 'image' | 'auto' | 'raw',
  ): Promise<UploadResult> {
    const fileContentHash = crypto
      .createHash('sha256')
      .update(file.buffer)
      .digest('hex');

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          transformation:
            resourceType === 'image'
              ? [{ quality: 'auto', fetch_format: 'auto' }]
              : undefined,
        },
        (error, result: UploadApiResponse | undefined) => {
          if (error) {
            reject(new BadRequestException('Upload failed: ' + error.message));
          } else if (result) {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              format: result.format,
              width: result.width,
              height: result.height,
              bytes: result.bytes,
              fileContentHash,
            });
          }
        },
      );

      const stream = Readable.from(file.buffer);
      stream.pipe(uploadStream);
    });
  }
}

