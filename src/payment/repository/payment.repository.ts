import { Injectable } from '@nestjs/common';
import { WebhookPaymentBodyDto } from '../dto';
import { PaymentStatus, TransferType } from '../enum';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createTransaction(data: WebhookPaymentBodyDto) {
    const [amountIn, amountOut] =
      data.transferType === TransferType.IN
        ? [data.transferAmount, 0]
        : [0, data.transferAmount];

    return this.prisma.paymentTransaction.create({
      data: {
        id: data.id,
        gateway: data.gateway,
        transactionDate: new Date(data.transactionDate.replace(' ', 'T')),
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
  }

  async findPaymentByCode(paymentCode: string) {
    return this.prisma.payment.findUnique({
      where: { paymentCode },
      include: { appointment: true },
    });
  }

  async updatePaymentStatus(paymentCode: string, status: PaymentStatus) {
    return this.prisma.payment.update({
      where: { paymentCode },
      data: { status },
    });
  }
}
