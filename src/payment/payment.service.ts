import { Injectable, Logger } from '@nestjs/common';
import {
  WebhookPaymentBodyDto,
  QueryPaymentDto,
  QueryMyPaymentDto,
} from './dto';
import { PaymentRepository } from './repository/payment.repository';
import { PaymentStatus, TransferType } from './enum';
import { ExceptionUtils, CodeGeneratorUtils } from '../common/utils';
import { PaymentBlockchainService } from '../blockchain';
import { PaymentGateway } from './payment.gateway';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly paymentBlockchainService: PaymentBlockchainService,
    private readonly paymentGateway: PaymentGateway,
  ) {}

  async findAll(query: QueryPaymentDto) {
    return this.paymentRepository.findAll(query);
  }

  async findOne(id: string) {
    const payment = await this.paymentRepository.findOne(id);
    if (!payment) {
      ExceptionUtils.throwNotFound('Payment not found');
    }
    return payment;
  }

  async findMyPayments(patientId: string, query: QueryMyPaymentDto) {
    return this.paymentRepository.findByPatientId(patientId, query);
  }

  async findMyPaymentById(id: string, patientId: string) {
    const payment = await this.paymentRepository.findOneByPatient(
      id,
      patientId,
    );
    if (!payment) {
      ExceptionUtils.throwNotFound('Payment not found');
    }
    return payment;
  }

  async receiver(data: WebhookPaymentBodyDto) {
    this.logger.log(
      `Received payment webhook: transactionId=${data.id}, code=${data.code}`,
    );

    const transaction = await this.paymentRepository.createTransaction(data);

    if (data.transferType !== TransferType.IN) {
      return { success: true, message: 'Outgoing transfer recorded' };
    }

    const paymentCode = this.extractPaymentCode(data);
    const payment = await this.validateAndGetPayment(
      paymentCode,
      data.transferAmount,
    );

    await this.paymentRepository.linkTransactionToPayment(
      transaction.id,
      payment.id,
    );

    if (payment.status === PaymentStatus.SUCCESS) {
      this.logger.warn(`Payment ${paymentCode} already processed, skipping`);
      return { success: true, message: 'Payment already processed' };
    }

    await this.paymentRepository.updatePaymentStatus(
      paymentCode,
      PaymentStatus.SUCCESS,
    );
    this.logger.log(`Payment ${paymentCode} processed successfully`);

    this.recordOnBlockchainAsync(payment.id);

    const patientUserId = payment.appointment?.patient?.userId;
    if (patientUserId) {
      this.paymentGateway.emitPaymentSuccess(patientUserId, {
        paymentId: payment.id,
        paymentCode,
        amount: data.transferAmount,
        appointmentId: payment.appointment.id,
        message: 'Thanh toán thành công!',
        timestamp: new Date().toISOString(),
      });
    }

    return {
      success: true,
      message: 'Payment received successfully',
      data: { paymentCode },
    };
  }

  private recordOnBlockchainAsync(paymentId: string) {
    this.paymentBlockchainService
      .recordPaymentOnBlockchain(paymentId)
      .then((result) => {
        this.logger.log(
          `Payment ${paymentId} recorded on blockchain: txHash=${result.txHash}`,
        );
      })
      .catch((error) => {
        this.logger.warn(
          `Failed to record payment ${paymentId} on blockchain: ${error.message}`,
        );
      });
  }

  private extractPaymentCode(data: WebhookPaymentBodyDto): string {
    const paymentCode =
      CodeGeneratorUtils.extractCode(data.code ?? '') ??
      CodeGeneratorUtils.extractCode(data.content ?? '');

    if (!paymentCode) {
      ExceptionUtils.throwBadRequest(
        'Cannot extract payment code from code or content',
      );
    }

    return paymentCode;
  }

  private async validateAndGetPayment(
    paymentCode: string,
    transferAmount: number,
  ) {
    const payment = await this.paymentRepository.findPaymentByCode(paymentCode);

    if (!payment) {
      ExceptionUtils.throwBadRequest(
        `Cannot find payment with code ${paymentCode}`,
      );
    }

    const { appointment } = payment;
    if (!appointment) {
      ExceptionUtils.throwBadRequest(
        `Payment ${paymentCode} has no associated appointment`,
      );
    }

    if (payment.amount !== transferAmount) {
      ExceptionUtils.throwBadRequest(
        `Payment amount (${transferAmount}) does not match expected amount (${payment.amount})`,
      );
    }

    return payment;
  }
}
