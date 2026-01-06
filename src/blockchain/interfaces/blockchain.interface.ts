export interface PaymentHashData {
  paymentId: string;
  paymentCode: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  consultationFee: number;
  medicineFee: number;
  totalFee: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
}

export interface RecordPaymentResult {
  txHash: string;
  dataHash: string;
  blockNumber?: number;
}

export interface VerifyPaymentResult {
  isValid: boolean;
  status: PaymentBlockchainStatus;
  amount: number;
  timestamp: number;
  message: string;
}

export enum PaymentBlockchainStatus {
  PENDING = 0,
  SUCCESS = 1,
  FAILED = 2,
  REFUNDED = 3,
  VERIFIED = 4,
}

export interface BlockchainConfig {
  rpcUrl: string;
  privateKey: string;
  contractAddress: string;
}

export interface MedicalRecordHashData {
  documentId: string;
  appointmentId: string;
  title: string;
  documentType: string;
  documentUrl: string;
  uploadedById: string;
  createdAt: string;
  fileContentHash: string;
}

export interface RecordMedicalDocumentResult {
  txHash: string;
  dataHash: string;
  blockNumber?: number;
}

export interface VerifyMedicalRecordResult {
  isValid: boolean;
  isRevoked: boolean;
  recordType: MedicalRecordBlockchainType;
  timestamp: number;
  message: string;
}

export enum MedicalRecordBlockchainType {
  LAB_RESULT = 0,
  X_RAY = 1,
  MRI = 2,
  CT_SCAN = 3,
  ULTRASOUND = 4,
  PRESCRIPTION = 5,
  MEDICAL_REPORT = 6,
  OTHER = 7,
}

