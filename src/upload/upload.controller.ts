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
} from '@nestjs/common';
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
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles, CurrentUser } from '../auth/decorators';
import { UserRole } from '../common/constants';
import { ApiResponse } from '../common/dto';
import { CloudinaryService, UploadFolder } from './cloudinary.service';
import { DocumentType, UploadResponseDto } from './dto';
import { UploadService } from './upload.service';
import { MedicalRecordBlockchainService } from '../blockchain';

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
    summary: 'Upload tài liệu y tế cho lịch hẹn',
    description:
      'Nếu documentType là MEDICAL_CASE (bệnh án), tài liệu sẽ tự động được ghi lên blockchain',
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
  @ApiResponseSwagger({ status: 200, description: 'Upload thành công' })
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
    const uploadResult = await this.cloudinaryService.uploadDocument(
      file,
      UploadFolder.MEDICAL_DOCUMENTS,
    );

    const document = await this.uploadService.createAppointmentDocument(
      appointmentId,
      userId,
      {
        title,
        documentType,
        documentUrl: uploadResult.url,
        notes,
        fileContentHash: uploadResult.fileContentHash,
      },
    );

    let blockchainResult: { txHash: string; dataHash: string; blockNumber?: number } | null = null;

    if (documentType === DocumentType.MEDICAL_CASE) {
      try {
        blockchainResult =
          await this.medicalRecordBlockchainService.recordDocumentOnBlockchain(
            document.id,
          );
        this.logger.log(
          `Medical case ${document.id} recorded on blockchain: ${blockchainResult?.txHash}`,
        );
      } catch (error) {
        this.logger.error(
          `Auto blockchain recording failed for ${document.id}: ${error.message}`,
        );
      }
    }

    return ApiResponse.success(
      { document, blockchain: blockchainResult },
      blockchainResult
        ? 'Upload bệnh án và ghi blockchain thành công'
        : 'Upload tài liệu y tế thành công',
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
}

