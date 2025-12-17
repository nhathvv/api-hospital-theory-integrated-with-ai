import { Injectable } from '@nestjs/common';
import { ExceptionUtils, CodeGeneratorUtils } from 'src/common/utils';
import { WebhookPaymentBodyDto } from '../dto';
import { PaymentStatus, TransferType } from '../enum';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async receiver(data: WebhookPaymentBodyDto) {
    const [amountIn, amountOut] = data.transferType === TransferType.IN
      ? [data.transferAmount, 0]
      : [0, data.transferAmount];

    await this.prisma.paymentTransaction.create({
      data: {
        id: data.id,
        gateway: data.gateway,
        transactionDate: data.transactionDate,
        accountNumber: data.accountNumber,
        subAccount: data.subAccount ?? null,
        code: data.code ?? null,
        amountIn,
        amountOut,
        accumulated: data.accumulated ?? 0,
        transactionContent: data.content,
        body: data.description,
        referenceNumber: data.referenceCode,
      },
    });

    const paymentCode = CodeGeneratorUtils.extractCode(data.code ?? '') 
      ?? CodeGeneratorUtils.extractCode(data.content ?? '');
    if (!paymentCode) {
      ExceptionUtils.throwBadRequest('Cannot extract payment code from code or content');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { paymentCode },
      include: { appointment: true },
    });
    if (!payment) {
      ExceptionUtils.throwBadRequest(`Cannot find payment with code ${paymentCode}`);
    }

    const { appointment } = payment;
    if (!appointment) {
      ExceptionUtils.throwBadRequest(`Payment ${paymentCode} has no associated appointment`);
    }
    if (appointment.consultationFee !== data.transferAmount) {
      ExceptionUtils.throwBadRequest('Consultation fee does not match payment amount');
    }

    await this.prisma.payment.update({
      where: { paymentCode },
      data: { status: PaymentStatus.SUCCESS },
    });

    return {
      success: true,
      message: 'Payment received successfully',
      data: payment,
    };
  }
}