import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import { BlockchainService } from './blockchain.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  PaymentHashData,
  RecordPaymentResult,
  VerifyPaymentResult,
  PaymentBlockchainStatus,
} from './interfaces';
import { ExceptionUtils } from '../common/utils';

@Injectable()
export class PaymentBlockchainService {
  private readonly logger = new Logger(PaymentBlockchainService.name);

  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly prisma: PrismaService,
  ) {}

  async recordPaymentOnBlockchain(paymentId: string): Promise<RecordPaymentResult> {
    if (!this.blockchainService.isBlockchainEnabled()) {
      ExceptionUtils.throwBadRequest('Blockchain service is not enabled');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        appointment: {
          include: {
            patient: true,
            doctor: true,
          },
        },
      },
    });

    if (!payment) {
      ExceptionUtils.throwNotFound('Payment not found');
    }

    if (payment.dataHash && payment.blockchainTxHash) {
      this.logger.warn(`Payment ${paymentId} already recorded on blockchain`);
      return {
        txHash: payment.blockchainTxHash,
        dataHash: payment.dataHash,
      };
    }

    const { appointment } = payment;

    const hashData: PaymentHashData = {
      paymentId: payment.id,
      paymentCode: payment.paymentCode,
      appointmentId: payment.appointmentId,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      consultationFee: appointment.consultationFee ?? 0,
      medicineFee: appointment.medicineFee,
      totalFee: appointment.totalFee,
      paymentMethod: payment.method,
      paymentStatus: payment.status,
      createdAt: payment.createdAt.toISOString(),
    };

    const dataHash = this.blockchainService.generateHash(hashData);
    const contract = this.blockchainService.getPaymentContract();

    if (!contract) {
      ExceptionUtils.throwBadRequest('Blockchain contract not available');
    }

    const paymentIdBytes = this.blockchainService.stringToBytes32(payment.id);
    const appointmentIdBytes = this.blockchainService.stringToBytes32(
      payment.appointmentId,
    );
    const dataHashBytes = '0x' + dataHash;
    const patientAddress = this.getPatientAddress(appointment.patient.userId);

    this.logger.log(`Recording payment ${paymentId} on blockchain...`);

    const tx = await contract.recordPayment(
      paymentIdBytes,
      appointmentIdBytes,
      dataHashBytes,
      appointment.totalFee,
      patientAddress,
    );

    const receipt = await tx.wait();

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        dataHash,
        blockchainTxHash: receipt.hash,
      },
    });

    this.logger.log(
      `Payment ${paymentId} recorded on blockchain: txHash=${receipt.hash}`,
    );

    return {
      txHash: receipt.hash,
      dataHash,
      blockNumber: receipt.blockNumber,
    };
  }

  async verifyPayment(paymentId: string): Promise<VerifyPaymentResult> {
    if (!this.blockchainService.isBlockchainEnabled()) {
      return {
        isValid: false,
        status: PaymentBlockchainStatus.PENDING,
        amount: 0,
        timestamp: 0,
        message: 'Blockchain service is not enabled',
      };
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        appointment: {
          include: {
            patient: true,
            doctor: true,
          },
        },
      },
    });

    if (!payment) {
      ExceptionUtils.throwNotFound('Payment not found');
    }

    if (!payment.blockchainTxHash || !payment.dataHash) {
      return {
        isValid: false,
        status: PaymentBlockchainStatus.PENDING,
        amount: 0,
        timestamp: 0,
        message: 'Payment has not been recorded on blockchain',
      };
    }

    const { appointment } = payment;

    const hashData: PaymentHashData = {
      paymentId: payment.id,
      paymentCode: payment.paymentCode,
      appointmentId: payment.appointmentId,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      consultationFee: appointment.consultationFee ?? 0,
      medicineFee: appointment.medicineFee,
      totalFee: appointment.totalFee,
      paymentMethod: payment.method,
      paymentStatus: payment.status,
      createdAt: payment.createdAt.toISOString(),
    };

    const currentHash = this.blockchainService.generateHash(hashData);
    const contract = this.blockchainService.getPaymentContract();

    if (!contract) {
      return {
        isValid: false,
        status: PaymentBlockchainStatus.PENDING,
        amount: 0,
        timestamp: 0,
        message: 'Blockchain contract not available',
      };
    }

    const paymentIdBytes = this.blockchainService.stringToBytes32(payment.id);
    const currentHashBytes = '0x' + currentHash;

    const [isValid, status, amount, timestamp] = await contract.verifyPayment(
      paymentIdBytes,
      currentHashBytes,
    );

    if (isValid) {
      return {
        isValid: true,
        status: Number(status) as PaymentBlockchainStatus,
        amount: Number(amount),
        timestamp: Number(timestamp),
        message: 'Payment data is valid and has not been tampered',
      };
    }

    const storedHashMatches = payment.dataHash === currentHash;

    if (!storedHashMatches) {
      return {
        isValid: false,
        status: Number(status) as PaymentBlockchainStatus,
        amount: Number(amount),
        timestamp: Number(timestamp),
        message: 'WARNING: Payment data has been modified in the database',
      };
    }

    return {
      isValid: false,
      status: Number(status) as PaymentBlockchainStatus,
      amount: Number(amount),
      timestamp: Number(timestamp),
      message: 'Payment verification failed - data mismatch detected',
    };
  }

  async getPaymentBlockchainInfo(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      select: {
        id: true,
        paymentCode: true,
        dataHash: true,
        blockchainTxHash: true,
        status: true,
      },
    });

    if (!payment) {
      ExceptionUtils.throwNotFound('Payment not found');
    }

    const verification = await this.verifyPayment(paymentId);

    return {
      payment: {
        id: payment.id,
        paymentCode: payment.paymentCode,
        status: payment.status,
      },
      blockchain: {
        dataHash: payment.dataHash,
        txHash: payment.blockchainTxHash,
        isRecorded: !!payment.blockchainTxHash,
      },
      verification,
    };
  }

  async getBlockchainStatistics() {
    if (!this.blockchainService.isBlockchainEnabled()) {
      return {
        enabled: false,
        totalPayments: 0,
        totalAmount: 0,
        walletBalance: '0',
      };
    }

    const contract = this.blockchainService.getPaymentContract();

    if (!contract) {
      return {
        enabled: true,
        totalPayments: 0,
        totalAmount: 0,
        walletBalance: '0',
      };
    }

    const [totalPayments, totalAmount] = await contract.getStatistics();
    const walletBalance = await this.blockchainService.getBalance();

    return {
      enabled: true,
      totalPayments: Number(totalPayments),
      totalAmount: Number(totalAmount),
      walletBalance,
    };
  }

  private getPatientAddress(userId: string): string {
    return ethers.keccak256(ethers.toUtf8Bytes(userId)).slice(0, 42);
  }
}

