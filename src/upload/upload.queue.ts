export const UPLOAD_QUEUE_NAME = 'upload-queue';

export enum UploadJobType {
  MEDICAL_DOCUMENT = 'medical-document',
}

export enum UploadJobStatus {
  PENDING = 'PENDING',
  UPLOADING = 'UPLOADING',
  PROCESSING_BLOCKCHAIN = 'PROCESSING_BLOCKCHAIN',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface MedicalDocumentJobData {
  userId: string;
  appointmentId: string;
  title: string;
  documentType: string;
  notes?: string;
  file: {
    buffer: string;
    originalname: string;
    mimetype: string;
    size: number;
  };
}

export interface UploadJobResult {
  status: UploadJobStatus;
  documentId?: string;
  documentUrl?: string;
  blockchain?: {
    txHash: string;
    dataHash: string;
    blockNumber?: number;
  } | null;
  error?: string;
}
