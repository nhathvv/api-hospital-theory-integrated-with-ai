import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { CloudinaryService, UploadFolder } from './cloudinary.service';
import { UploadService } from './upload.service';
import { UploadGateway } from './upload.gateway';
import { MedicalRecordBlockchainService } from '../blockchain';
import { DocumentType } from './dto';
import {
  UPLOAD_QUEUE_NAME,
  UploadJobType,
  UploadJobStatus,
  MedicalDocumentJobData,
  UploadJobResult,
} from './upload.queue';

@Processor(UPLOAD_QUEUE_NAME)
export class UploadProcessor extends WorkerHost {
  private readonly logger = new Logger(UploadProcessor.name);

  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly uploadService: UploadService,
    private readonly uploadGateway: UploadGateway,
    private readonly medicalRecordBlockchainService: MedicalRecordBlockchainService,
  ) {
    super();
  }

  async process(job: Job<MedicalDocumentJobData, UploadJobResult>): Promise<UploadJobResult> {
    const { userId, appointmentId, title, documentType, notes, file } = job.data;

    this.logger.log(`Processing job ${job.id} - ${job.name} for user ${userId}`);

    try {
      this.notifyUser(userId, job.id as string, UploadJobStatus.UPLOADING, {
        message: 'Đang upload file lên cloud...',
      });

      const fileBuffer = Buffer.from(file.buffer, 'base64');
      const multerFile = {
        buffer: fileBuffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      } as Express.Multer.File;

      const uploadResult = await this.cloudinaryService.uploadDocument(
        multerFile,
        UploadFolder.MEDICAL_DOCUMENTS,
      );

      const document = await this.uploadService.createAppointmentDocument(
        appointmentId,
        userId,
        {
          title,
          documentType: documentType as DocumentType,
          documentUrl: uploadResult.url,
          notes,
          fileContentHash: uploadResult.fileContentHash,
        },
      );

      let blockchainResult: { txHash: string; dataHash: string; blockNumber?: number } | null = null;

      if (documentType === DocumentType.MEDICAL_CASE) {
        this.notifyUser(userId, job.id as string, UploadJobStatus.PROCESSING_BLOCKCHAIN, {
          message: 'Đang ghi dữ liệu lên blockchain...',
          documentId: document.id,
        });

        try {
          blockchainResult =
            await this.medicalRecordBlockchainService.recordDocumentOnBlockchain(document.id);
          this.logger.log(`Medical case ${document.id} recorded on blockchain: ${blockchainResult?.txHash}`);
        } catch (error) {
          this.logger.error(`Blockchain recording failed for ${document.id}: ${error.message}`);
        }
      }

      const result: UploadJobResult = {
        status: UploadJobStatus.COMPLETED,
        documentId: document.id,
        documentUrl: uploadResult.url,
        blockchain: blockchainResult,
      };

      this.notifyUser(userId, job.id as string, UploadJobStatus.COMPLETED, {
        message: blockchainResult
          ? 'Upload bệnh án và ghi blockchain thành công!'
          : 'Upload tài liệu y tế thành công!',
        document: {
          id: document.id,
          title: document.title,
          documentType: document.documentType,
          documentUrl: document.documentUrl,
        },
        blockchain: blockchainResult,
      });

      return result;
    } catch (error) {
      this.logger.error(`Job ${job.id} failed: ${error.message}`);

      this.notifyUser(userId, job.id as string, UploadJobStatus.FAILED, {
        message: 'Upload thất bại: ' + error.message,
        error: error.message,
      });

      throw error;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<MedicalDocumentJobData, UploadJobResult>) {
    this.logger.log(`Job ${job.id} completed successfully`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<MedicalDocumentJobData, UploadJobResult>, error: Error) {
    this.logger.error(`Job ${job.id} failed with error: ${error.message}`);
  }

  private notifyUser(userId: string, jobId: string, status: UploadJobStatus, data: any) {
    this.uploadGateway.emitUploadProgress(userId, {
      jobId,
      status,
      ...data,
      timestamp: new Date().toISOString(),
    });
  }
}
