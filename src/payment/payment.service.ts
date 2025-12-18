import { Injectable, Logger } from '@nestjs/common';
import { WebhookPaymentBodyDto } from './dto';
import { PaymentRepository } from './repository/payment.repository';
import { PaymentStatus, TransferType } from './enum';
import { ExceptionUtils, CodeGeneratorUtils } from '../common/utils';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(private readonly paymentRepository: PaymentRepository) {}

  async receiver(data: WebhookPaymentBodyDto) {
    this.logger.log(`Received payment webhook: transactionId=${data.id}, code=${data.code}`);
    await this.paymentRepository.createTransaction(data);
    if (data.transferType !== TransferType.IN) {
      return { success: true, message: 'Outgoing transfer recorded' };
    }
    const paymentCode = this.extractPaymentCode(data);
    const payment = await this.validateAndGetPayment(paymentCode, data.transferAmount);

    if (payment.status === PaymentStatus.SUCCESS) {
      this.logger.warn(`Payment ${paymentCode} already processed, skipping`);
      return { success: true, message: 'Payment already processed' };
    }
    await this.paymentRepository.updatePaymentStatus(paymentCode, PaymentStatus.SUCCESS);
    this.logger.log(`Payment ${paymentCode} processed successfully`);
    return {
      success: true,
      message: 'Payment received successfully',
      data: { paymentCode },
    };
  }

  private extractPaymentCode(data: WebhookPaymentBodyDto): string {
    const paymentCode =
      CodeGeneratorUtils.extractCode(data.code ?? '') ??
      CodeGeneratorUtils.extractCode(data.content ?? '');

    if (!paymentCode) {
      ExceptionUtils.throwBadRequest('Cannot extract payment code from code or content');
    }

    return paymentCode;
  }

  private async validateAndGetPayment(paymentCode: string, transferAmount: number) {
    const payment = await this.paymentRepository.findPaymentByCode(paymentCode);

    if (!payment) {
      ExceptionUtils.throwBadRequest(`Cannot find payment with code ${paymentCode}`);
    }

    const { appointment } = payment;
    if (!appointment) {
      ExceptionUtils.throwBadRequest(`Payment ${paymentCode} has no associated appointment`);
    }

    if (appointment.consultationFee !== transferAmount) {
      ExceptionUtils.throwBadRequest(
        `Consultation fee (${appointment.consultationFee}) does not match payment amount (${transferAmount})`,
      );
    }

    return payment;
  }
}
