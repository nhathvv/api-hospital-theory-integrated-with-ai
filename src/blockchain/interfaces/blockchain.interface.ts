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

