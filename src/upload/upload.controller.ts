import {
  Controller,
  Post,
  Get,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Body,
  Param,
  Delete,
  Logger,
  Res,
  Query,
  NotFoundException,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as ApiResponseSwagger,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles, CurrentUser, Public } from '../auth/decorators';
import { UserRole } from '../common/constants';
import { ApiResponse } from '../common/dto';
import { CloudinaryService, UploadFolder } from './cloudinary.service';
import { DocumentType, UploadResponseDto } from './dto';
import { UploadService } from './upload.service';
import { MedicalRecordBlockchainService } from '../blockchain';
import {
  UPLOAD_QUEUE_NAME,
  UploadJobType,
  UploadJobStatus,
  MedicalDocumentJobData,
} from './upload.queue';

@ApiTags('Upload')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('upload')
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly uploadService: UploadService,
    private readonly medicalRecordBlockchainService: MedicalRecordBlockchainService,
    @InjectQueue(UPLOAD_QUEUE_NAME) private readonly uploadQueue: Queue,
  ) {}

  @Post('avatar')
  @Roles(UserRole.PATIENT, UserRole.DOCTOR, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload avatar' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponseSwagger({ status: 200, description: 'Upload thành công', type: UploadResponseDto })
  @ApiResponseSwagger({ status: 400, description: 'File không hợp lệ' })
  async uploadAvatar(
    @CurrentUser('sub') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const result = await this.cloudinaryService.uploadImage(
      file,
      UploadFolder.AVATARS,
    );
    await this.uploadService.updateUserAvatar(userId, result.url);
    return ApiResponse.success(result, 'Upload avatar thành công');
  }

  @Post('medical-document/:appointmentId')
  @Roles(UserRole.PATIENT, UserRole.DOCTOR, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload tài liệu y tế cho lịch hẹn (Background Job)',
    description: `
      Upload tài liệu y tế được xử lý trong background job.
      - API trả về jobId ngay lập tức
      - Kết quả được thông báo qua WebSocket (namespace: /api/v1/upload, event: upload_progress)
      - Hoặc có thể polling qua GET /upload/job/:jobId
      
      Nếu documentType là MEDICAL_CASE (bệnh án), tài liệu sẽ tự động được ghi lên blockchain.
    `,
  })
  @ApiParam({ name: 'appointmentId', description: 'ID lịch hẹn' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'title', 'documentType'],
      properties: {
        file: { type: 'string', format: 'binary' },
        title: { type: 'string', example: 'Bệnh án bệnh nhân' },
        documentType: {
          type: 'string',
          enum: Object.values(DocumentType),
          example: DocumentType.MEDICAL_CASE,
        },
        notes: { type: 'string', example: 'Ghi chú' },
      },
    },
  })
  @ApiResponseSwagger({
    status: 202,
    description: 'Job đã được tạo, đang xử lý trong background',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            jobId: { type: 'string', example: '123' },
            status: { type: 'string', example: 'PENDING' },
          },
        },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponseSwagger({ status: 400, description: 'File không hợp lệ' })
  @ApiResponseSwagger({ status: 404, description: 'Không tìm thấy lịch hẹn' })
  async uploadMedicalDocument(
    @CurrentUser('sub') userId: string,
    @Param('appointmentId') appointmentId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('title') title: string,
    @Body('documentType') documentType: DocumentType,
    @Body('notes') notes?: string,
  ) {
    const jobData: MedicalDocumentJobData = {
      userId,
      appointmentId,
      title,
      documentType,
      notes,
      file: {
        buffer: file.buffer.toString('base64'),
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      },
    };

    const job = await this.uploadQueue.add(
      UploadJobType.MEDICAL_DOCUMENT,
      jobData,
      {
        removeOnComplete: { age: 3600, count: 100 },
        removeOnFail: { age: 86400, count: 200 },
      },
    );

    this.logger.log(`Created upload job ${job.id} for user ${userId}`);

    return ApiResponse.success(
      {
        jobId: job.id,
        status: UploadJobStatus.PENDING,
        message: 'Upload job đã được tạo, vui lòng theo dõi qua WebSocket hoặc polling',
      },
      'Đang xử lý upload trong background',
    );
  }

  @Get('job/:jobId')
  @Roles(UserRole.PATIENT, UserRole.DOCTOR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Kiểm tra trạng thái job upload',
    description: 'Polling endpoint để kiểm tra trạng thái của job upload',
  })
  @ApiParam({ name: 'jobId', description: 'ID của job' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Trạng thái job',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            jobId: { type: 'string' },
            status: { type: 'string', enum: Object.values(UploadJobStatus) },
            progress: { type: 'number' },
            result: { type: 'object' },
            failedReason: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponseSwagger({ status: 404, description: 'Không tìm thấy job' })
  async getJobStatus(@Param('jobId') jobId: string) {
    const job = await this.uploadQueue.getJob(jobId);

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const state = await job.getState();
    const progress = job.progress;
    const result = job.returnvalue;
    const failedReason = job.failedReason;

    let status: UploadJobStatus;
    switch (state) {
      case 'waiting':
      case 'delayed':
        status = UploadJobStatus.PENDING;
        break;
      case 'active':
        status = UploadJobStatus.UPLOADING;
        break;
      case 'completed':
        status = UploadJobStatus.COMPLETED;
        break;
      case 'failed':
        status = UploadJobStatus.FAILED;
        break;
      default:
        status = UploadJobStatus.PENDING;
    }

    return ApiResponse.success(
      {
        jobId: job.id,
        status,
        progress,
        result,
        failedReason,
        createdAt: new Date(job.timestamp).toISOString(),
      },
      'Lấy trạng thái job thành công',
    );
  }

  @Post('medical-documents/:appointmentId')
  @Roles(UserRole.PATIENT, UserRole.DOCTOR, UserRole.ADMIN)
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload nhiều tài liệu y tế' })
  @ApiParam({ name: 'appointmentId', description: 'ID lịch hẹn' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['files', 'title', 'documentType'],
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
        title: { type: 'string', example: 'Kết quả xét nghiệm' },
        documentType: {
          type: 'string',
          enum: Object.values(DocumentType),
          example: DocumentType.LAB_RESULT,
        },
        notes: { type: 'string' },
      },
    },
  })
  @ApiResponseSwagger({ status: 200, description: 'Upload thành công' })
  async uploadMultipleMedicalDocuments(
    @CurrentUser('sub') userId: string,
    @Param('appointmentId') appointmentId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('title') title: string,
    @Body('documentType') documentType: DocumentType,
    @Body('notes') notes?: string,
  ) {
    const uploadResults = await this.cloudinaryService.uploadMultipleDocuments(
      files,
      UploadFolder.MEDICAL_DOCUMENTS,
    );

    const documents = await this.uploadService.createMultipleAppointmentDocuments(
      appointmentId,
      userId,
      uploadResults.map((result, index) => ({
        title: files.length > 1 ? `${title} (${index + 1})` : title,
        documentType,
        documentUrl: result.url,
        notes,
        fileContentHash: result.fileContentHash,
      })),
    );

    return ApiResponse.success(documents, 'Upload tài liệu y tế thành công');
  }

  @Delete('document/:documentId')
  @Roles(UserRole.PATIENT, UserRole.DOCTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Xóa tài liệu y tế' })
  @ApiParam({ name: 'documentId', description: 'ID tài liệu' })
  @ApiResponseSwagger({ status: 200, description: 'Xóa thành công' })
  @ApiResponseSwagger({ status: 404, description: 'Không tìm thấy tài liệu' })
  async deleteDocument(
    @CurrentUser('sub') userId: string,
    @Param('documentId') documentId: string,
  ) {
    await this.uploadService.deleteAppointmentDocument(documentId, userId);
    return ApiResponse.success(null, 'Xóa tài liệu thành công');
  }

  @Post('attachment')
  @Roles(UserRole.PATIENT, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload file đính kèm (conversation)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponseSwagger({ status: 200, description: 'Upload thành công', type: UploadResponseDto })
  async uploadAttachment(@UploadedFile() file: Express.Multer.File) {
    const result = await this.cloudinaryService.uploadDocument(
      file,
      UploadFolder.ATTACHMENTS,
    );
    return ApiResponse.success(result, 'Upload file đính kèm thành công');
  }

  @Post('document/:documentId/blockchain')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Ghi tài liệu y tế lên blockchain',
    description: `
      Ghi hash tài liệu y tế lên blockchain để đảm bảo tính toàn vẹn.
      
      **Lợi ích:**
      - Chống giả mạo tài liệu
      - Xác minh tính toàn vẹn
      - Audit trail bất biến
    `,
  })
  @ApiParam({ name: 'documentId', description: 'ID tài liệu' })
  @ApiResponseSwagger({ status: 200, description: 'Ghi blockchain thành công' })
  @ApiResponseSwagger({ status: 400, description: 'Blockchain service không khả dụng' })
  @ApiResponseSwagger({ status: 404, description: 'Không tìm thấy tài liệu' })
  async recordDocumentOnBlockchain(@Param('documentId') documentId: string) {
    const result =
      await this.medicalRecordBlockchainService.recordDocumentOnBlockchain(
        documentId,
      );
    return ApiResponse.success(result, 'Ghi tài liệu lên blockchain thành công');
  }

  @Get('document/:documentId/blockchain/verify')
  @Roles(UserRole.PATIENT, UserRole.DOCTOR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Xác minh tài liệu y tế trên blockchain',
    description: 'Kiểm tra tính toàn vẹn của tài liệu so với dữ liệu trên blockchain',
  })
  @ApiParam({ name: 'documentId', description: 'ID tài liệu' })
  @ApiResponseSwagger({ status: 200, description: 'Xác minh thành công' })
  @ApiResponseSwagger({ status: 404, description: 'Không tìm thấy tài liệu' })
  async verifyDocumentOnBlockchain(@Param('documentId') documentId: string) {
    const result =
      await this.medicalRecordBlockchainService.verifyDocument(documentId);
    return ApiResponse.success(result, 'Xác minh tài liệu thành công');
  }

  @Post('document/:documentId/blockchain/verify-file')
  @Roles(UserRole.PATIENT, UserRole.DOCTOR, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Xác minh file đã tải về với blockchain',
    description: `
      Upload file đã tải về để kiểm tra tính toàn vẹn.
      BE sẽ tính hash của file và so sánh với dữ liệu trên blockchain.
      Đây là cách verify TRUSTLESS - không phụ thuộc vào dữ liệu trong DB.
    `,
  })
  @ApiParam({ name: 'documentId', description: 'ID tài liệu' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponseSwagger({ status: 200, description: 'Xác minh thành công' })
  @ApiResponseSwagger({ status: 404, description: 'Không tìm thấy tài liệu' })
  async verifyFileOnBlockchain(
    @Param('documentId') documentId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const result =
      await this.medicalRecordBlockchainService.verifyUploadedFile(
        documentId,
        file.buffer,
      );
    return ApiResponse.success(result, 'Xác minh file thành công');
  }

  @Get('document/:documentId/blockchain')
  @Roles(UserRole.PATIENT, UserRole.DOCTOR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Lấy thông tin blockchain của tài liệu',
    description: 'Lấy thông tin hash, transaction, trạng thái blockchain của tài liệu',
  })
  @ApiParam({ name: 'documentId', description: 'ID tài liệu' })
  @ApiResponseSwagger({ status: 200, description: 'Lấy thông tin thành công' })
  @ApiResponseSwagger({ status: 404, description: 'Không tìm thấy tài liệu' })
  async getDocumentBlockchainInfo(@Param('documentId') documentId: string) {
    const result =
      await this.medicalRecordBlockchainService.getDocumentBlockchainInfo(
        documentId,
      );
    return ApiResponse.success(result, 'Lấy thông tin blockchain thành công');
  }

  @Get('document/:documentId/file')
  @Public()
  @ApiOperation({
    summary: 'Proxy để xem/tải tài liệu',
    description: 'Serve file trực tiếp từ server, bypass CORS issues (Public endpoint)',
  })
  @ApiParam({ name: 'documentId', description: 'ID tài liệu' })
  @ApiResponseSwagger({ status: 200, description: 'File stream' })
  @ApiResponseSwagger({ status: 404, description: 'Không tìm thấy tài liệu' })
  async proxyDocumentFile(
    @Param('documentId') documentId: string,
    @Query('download') download: string,
    @Res() res: Response,
  ) {
    const document = await this.uploadService.getDocumentById(documentId);
    const fileUrl = document.documentUrl;

    this.logger.log(`Proxy file request for document ${documentId}`);
    this.logger.log(`Original URL: ${fileUrl}`);

    if (!fileUrl) {
      return res.status(404).json({
        success: false,
        message: 'Document không có URL',
      });
    }
    try {
      const publicIdMatch = fileUrl.match(/\/upload\/(?:v\d+\/)?(.+)$/);
      const isRaw = fileUrl.includes('/raw/');
      
      if (!publicIdMatch) {
        return res.status(400).json({
          success: false,
          message: 'Không thể parse URL file',
        });
      }
      let publicId = publicIdMatch[1];
      let format: string | undefined;   
      if (!isRaw) {
        const extMatch = publicId.match(/\.([^/.]+)$/);
        if (extMatch) {
          format = extMatch[1];
          publicId = publicId.replace(/\.[^/.]+$/, '');
        }
      }
      
      this.logger.log(`Downloading file - Public ID: ${publicId}, Format: ${format}, isRaw: ${isRaw}`);

      const buffer = await this.cloudinaryService.downloadFile(
        publicId,
        isRaw ? 'raw' : 'image',
        format,
      );

      const filename = fileUrl.split('/').pop() || 'document';
      const ext = filename.split('.').pop() || '';
      
      const contentTypeMap: Record<string, string> = {
        pdf: 'application/pdf',
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        gif: 'image/gif',
        webp: 'image/webp',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      };
      
      const contentType = contentTypeMap[ext.toLowerCase()] || 'application/octet-stream';

      res.setHeader('Content-Type', contentType);
      if (download === 'true') {
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${encodeURIComponent(document.title)}.${ext}"`,
        );
      } else {
        res.setHeader('Content-Disposition', 'inline');
      }

      res.send(buffer);
    } catch (error) {
      this.logger.error(`Error fetching file: ${error}`);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi tải file',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

