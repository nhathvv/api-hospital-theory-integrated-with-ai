import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ethers } from 'ethers';
import * as crypto from 'crypto';
import { BlockchainService } from './blockchain.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  MedicalRecordHashData,
  RecordMedicalDocumentResult,
  VerifyMedicalRecordResult,
  MedicalRecordBlockchainType,
} from './interfaces';
import { ExceptionUtils } from '../common/utils';
import { HOSPITAL_MEDICAL_RECORD_REGISTRY_ABI } from './contracts';
import { EnvService } from '../configs/envs/env-service';

@Injectable()
export class MedicalRecordBlockchainService implements OnModuleInit {
  private readonly logger = new Logger(MedicalRecordBlockchainService.name);
  private medicalRecordContract: ethers.Contract | null = null;
  private isEnabled = false;

  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    await this.initialize();
  }

  private async initialize() {
    const envService = EnvService.getInstance();
    const contractAddress = envService.getMedicalRecordRegistryContract();

    if (!contractAddress) {
      this.logger.warn(
        'MEDICAL_RECORD_REGISTRY_CONTRACT not configured. Medical record blockchain features will be disabled.',
      );
      return;
    }

    let wallet = this.blockchainService.getWallet();
    let retries = 0;
    const maxRetries = 10;

    while (!wallet && retries < maxRetries) {
      this.logger.log(`Waiting for BlockchainService to initialize... (${retries + 1}/${maxRetries})`);
      await new Promise((resolve) => setTimeout(resolve, 500));
      wallet = this.blockchainService.getWallet();
      retries++;
    }

    if (!wallet) {
      this.logger.warn(
        'BlockchainService wallet not available. Medical record blockchain features will be disabled.',
      );
      return;
    }

    try {
      this.medicalRecordContract = new ethers.Contract(
        contractAddress,
        HOSPITAL_MEDICAL_RECORD_REGISTRY_ABI,
        wallet,
      );
      this.isEnabled = true;
      this.logger.log('Medical Record Blockchain service initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Medical Record contract');
      this.logger.error(error instanceof Error ? error.message : String(error));
    }
  }

  isServiceEnabled(): boolean {
    return this.isEnabled && this.blockchainService.isBlockchainEnabled();
  }

  async recordDocumentOnBlockchain(
    documentId: string,
  ): Promise<RecordMedicalDocumentResult> {
    if (!this.isServiceEnabled()) {
      ExceptionUtils.throwBadRequest(
        'Medical Record Blockchain service is not enabled',
      );
    }

    const document = await this.prisma.appointmentDocument.findUnique({
      where: { id: documentId },
      include: {
        appointment: {
          select: { id: true },
        },
      },
    });

    if (!document) {
      ExceptionUtils.throwNotFound('Document not found');
    }

    const existingTx = await this.prisma.blockchainTransaction.findFirst({
      where: {
        recordType: 'MEDICAL_RECORD',
        recordId: documentId,
        status: 'CONFIRMED',
      },
    });

    if (existingTx) {
      this.logger.warn(`Document ${documentId} already recorded on blockchain`);
      return {
        txHash: existingTx.txHash,
        dataHash: existingTx.dataHash,
      };
    }

    const fileContentHash = document.fileContentHash 
      ?? await this.hashFileContent(document.documentUrl);
    this.logger.log(`File content hash for ${documentId}: ${fileContentHash} (from ${document.fileContentHash ? 'DB' : 'fetch'})`);

    const hashData: MedicalRecordHashData = {
      documentId: document.id,
      appointmentId: document.appointmentId,
      title: document.title,
      documentType: document.documentType,
      documentUrl: document.documentUrl,
      uploadedById: document.uploadedById,
      createdAt: document.createdAt.toISOString(),
      fileContentHash,
    };

    const dataHash = this.blockchainService.generateHash(hashData);

    if (!this.medicalRecordContract) {
      ExceptionUtils.throwBadRequest('Medical Record contract not available');
    }

    const recordIdBytes = this.blockchainService.stringToBytes32(document.id);
    const appointmentIdBytes = this.blockchainService.stringToBytes32(
      document.appointmentId,
    );
    const dataHashBytes = '0x' + dataHash;
    const recordType = this.mapDocumentTypeToBlockchain(document.documentType);

    this.logger.log(`Recording document ${documentId} on blockchain...`);

    await this.prisma.blockchainTransaction.create({
      data: {
        txHash: 'pending_' + documentId,
        dataHash,
        recordType: 'MEDICAL_RECORD',
        recordId: documentId,
        status: 'PENDING',
      },
    });

    try {
      const tx = await this.medicalRecordContract.createRecord(
        recordIdBytes,
        appointmentIdBytes,
        dataHashBytes,
        recordType,
        {
          gasLimit: 300000,
          gasPrice: ethers.parseUnits('35', 'gwei'),
        },
      );

      const receipt = await tx.wait();

      await this.prisma.blockchainTransaction.updateMany({
        where: {
          recordType: 'MEDICAL_RECORD',
          recordId: documentId,
          status: 'PENDING',
        },
        data: {
          txHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          status: 'CONFIRMED',
          confirmedAt: new Date(),
          gasUsed: receipt.gasUsed?.toString(),
        },
      });

      this.logger.log(
        `Document ${documentId} recorded on blockchain: txHash=${receipt.hash}`,
      );

      return {
        txHash: receipt.hash,
        dataHash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      await this.prisma.blockchainTransaction.updateMany({
        where: {
          recordType: 'MEDICAL_RECORD',
          recordId: documentId,
          status: 'PENDING',
        },
        data: {
          status: 'FAILED',
        },
      });
      throw error;
    }
  }

  async verifyDocument(documentId: string): Promise<VerifyMedicalRecordResult> {
    if (!this.isServiceEnabled()) {
      return {
        isValid: false,
        isRevoked: false,
        recordType: MedicalRecordBlockchainType.OTHER,
        timestamp: 0,
        message: 'Medical Record Blockchain service is not enabled',
      };
    }

    const document = await this.prisma.appointmentDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      ExceptionUtils.throwNotFound('Document not found');
    }

    const blockchainTx = await this.prisma.blockchainTransaction.findFirst({
      where: {
        recordType: 'MEDICAL_RECORD',
        recordId: documentId,
        status: 'CONFIRMED',
      },
    });

    if (!blockchainTx) {
      return {
        isValid: false,
        isRevoked: false,
        recordType: MedicalRecordBlockchainType.OTHER,
        timestamp: 0,
        message: 'Document has not been recorded on blockchain',
      };
    }

    const fileContentHash = document.fileContentHash 
      ?? await this.hashFileContent(document.documentUrl);

    const hashData: MedicalRecordHashData = {
      documentId: document.id,
      appointmentId: document.appointmentId,
      title: document.title,
      documentType: document.documentType,
      documentUrl: document.documentUrl,
      uploadedById: document.uploadedById,
      createdAt: document.createdAt.toISOString(),
      fileContentHash,
    };

    const currentHash = this.blockchainService.generateHash(hashData);

    if (!this.medicalRecordContract) {
      return {
        isValid: false,
        isRevoked: false,
        recordType: MedicalRecordBlockchainType.OTHER,
        timestamp: 0,
        message: 'Medical Record contract not available',
      };
    }

    const recordIdBytes = this.blockchainService.stringToBytes32(document.id);
    const currentHashBytes = '0x' + currentHash;

    const [isValid, isRevoked, recordType, timestamp] =
      await this.medicalRecordContract.verifyRecord(
        recordIdBytes,
        currentHashBytes,
      );

    if (isValid) {
      return {
        isValid: true,
        isRevoked: isRevoked,
        recordType: Number(recordType) as MedicalRecordBlockchainType,
        timestamp: Number(timestamp),
        message: isRevoked
          ? 'Document has been revoked'
          : 'Document is valid and has not been tampered',
      };
    }

    const storedHashMatches = blockchainTx.dataHash === currentHash;

    if (!storedHashMatches) {
      return {
        isValid: false,
        isRevoked: isRevoked,
        recordType: Number(recordType) as MedicalRecordBlockchainType,
        timestamp: Number(timestamp),
        message: 'WARNING: Document or file content has been modified',
      };
    }

    return {
      isValid: false,
      isRevoked: isRevoked,
      recordType: Number(recordType) as MedicalRecordBlockchainType,
      timestamp: Number(timestamp),
      message: 'Document verification failed - data mismatch detected',
    };
  }

  async getDocumentBlockchainInfo(documentId: string) {
    const document = await this.prisma.appointmentDocument.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        title: true,
        documentType: true,
        documentUrl: true,
        fileContentHash: true,
        createdAt: true,
      },
    });

    if (!document) {
      ExceptionUtils.throwNotFound('Document not found');
    }

    const blockchainTx = await this.prisma.blockchainTransaction.findFirst({
      where: {
        recordType: 'MEDICAL_RECORD',
        recordId: documentId,
      },
      orderBy: { createdAt: 'desc' },
    });

    const verification = await this.verifyDocument(documentId);
    const currentFileHash = document.fileContentHash 
      ?? await this.hashFileContent(document.documentUrl);

    return {
      document: {
        id: document.id,
        title: document.title,
        documentType: document.documentType,
        createdAt: document.createdAt,
      },
      blockchain: {
        dataHash: blockchainTx?.dataHash,
        txHash: blockchainTx?.txHash,
        blockNumber: blockchainTx?.blockNumber,
        status: blockchainTx?.status,
        isRecorded: blockchainTx?.status === 'CONFIRMED',
        recordedAt: blockchainTx?.confirmedAt,
      },
      fileIntegrity: {
        currentFileHash,
        hashSource: document.fileContentHash ? 'database' : 'fetched',
      },
      verification,
    };
  }

  async getBlockchainStatistics() {
    if (!this.isServiceEnabled() || !this.medicalRecordContract) {
      return {
        enabled: false,
        totalRecords: 0,
      };
    }

    const totalRecords = await this.medicalRecordContract.getStatistics();

    return {
      enabled: true,
      totalRecords: Number(totalRecords),
    };
  }

  private mapDocumentTypeToBlockchain(
    documentType: string,
  ): MedicalRecordBlockchainType {
    const mapping: Record<string, MedicalRecordBlockchainType> = {
      LAB_RESULT: MedicalRecordBlockchainType.LAB_RESULT,
      X_RAY: MedicalRecordBlockchainType.X_RAY,
      MRI: MedicalRecordBlockchainType.MRI,
      CT_SCAN: MedicalRecordBlockchainType.CT_SCAN,
      ULTRASOUND: MedicalRecordBlockchainType.ULTRASOUND,
      PRESCRIPTION: MedicalRecordBlockchainType.PRESCRIPTION,
      MEDICAL_REPORT: MedicalRecordBlockchainType.MEDICAL_REPORT,
      MEDICAL_CASE: MedicalRecordBlockchainType.MEDICAL_CASE,
    };
    return mapping[documentType] ?? MedicalRecordBlockchainType.OTHER;
  }

  private async hashFileContent(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        this.logger.warn(`Failed to fetch file from ${url}: ${response.status}`);
        return 'file_fetch_failed';
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      return crypto.createHash('sha256').update(buffer).digest('hex');
    } catch (error) {
      this.logger.error(`Error hashing file content: ${error}`);
      return 'file_hash_error';
    }
  }
}

