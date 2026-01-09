import { Injectable, BadRequestException, OnModuleInit, Logger } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';
import * as crypto from 'crypto';
import { EnvService } from '../configs/envs/env-service';

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
export class CloudinaryService implements OnModuleInit {
  private readonly logger = new Logger(CloudinaryService.name);
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

  onModuleInit() {
    const envService = EnvService.getInstance();
    const cloudName = envService.getCloudinaryCloudName();
    const apiKey = envService.getCloudinaryApiKey();
    const apiSecret = envService.getCloudinaryApiSecret();

    if (!cloudName || !apiKey || !apiSecret) {
      this.logger.warn('Cloudinary credentials not configured!');
      return;
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    this.logger.log(`Cloudinary configured with cloud_name: ${cloudName}`);
  }

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
    return this.upload(file, folder, 'auto');
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

  getSignedUrl(publicId: string, resourceType: 'image' | 'raw' = 'raw', format?: string): string {
    const url = cloudinary.url(publicId, {
      resource_type: resourceType,
      type: 'upload',
      sign_url: true,
      secure: true,
      format: format,
    });
    this.logger.log(`Generated signed URL for ${resourceType}/${publicId}: ${url}`);
    return url;
  }

  async downloadFile(publicId: string, resourceType: 'image' | 'raw' = 'image', format?: string): Promise<Buffer> {
    try {
      const resource = await cloudinary.api.resource(publicId, {
        resource_type: resourceType,
      });
      
      this.logger.log(`Resource secure_url: ${resource.secure_url}`);
      
      const urlsToTry = [
        resource.secure_url,
        cloudinary.url(publicId, {
          resource_type: resourceType,
          type: 'upload',
          secure: true,
          format: format,
          flags: 'attachment',
          sign_url: true,
        }),
        cloudinary.url(publicId, {
          resource_type: resourceType,
          type: 'upload', 
          secure: true,
          format: format,
          transformation: [{ flags: 'attachment' }],
          sign_url: true,
        }),
        `https://res.cloudinary.com/${cloudinary.config().cloud_name}/image/upload/fl_attachment/${publicId}${format ? '.' + format : ''}`,
      ];
      
      for (const url of urlsToTry) {
        this.logger.log(`Trying URL: ${url}`);
        try {
          const response = await fetch(url);
          if (response.ok) {
            this.logger.log(`Success with URL: ${url}`);
            const arrayBuffer = await response.arrayBuffer();
            return Buffer.from(arrayBuffer);
          }
          this.logger.log(`Failed with status: ${response.status}`);
        } catch (e) {
          this.logger.log(`Error with URL: ${e}`);
        }
      }
      
      throw new Error('All download URLs failed');
    } catch (error) {
      this.logger.error(`Download failed: ${error}`);
      throw error;
    }
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

    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const rawPublicId =
      resourceType === 'raw' ? `${Date.now()}_${sanitizedFilename}` : undefined;

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          public_id: rawPublicId,
          type: 'upload',
          access_mode: 'public',
          transformation:
            resourceType === 'image'
              ? [{ quality: 'auto', fetch_format: 'auto' }]
              : undefined,
        },
        (error, result: UploadApiResponse | undefined) => {
          if (error) {
            this.logger.error(`Upload failed: ${error.message}`, error);
            reject(new BadRequestException('Upload failed: ' + error.message));
          } else if (result) {
            this.logger.log(`Upload success: ${result.secure_url}`);
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

