import { Injectable } from '@nestjs/common';
import { WebhookPaymentBodyDto, QueryPaymentDto } from '../dto';
import { PaymentStatus, TransferType } from '../enum';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

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

  async findAll(query: QueryPaymentDto) {
    const where = this.buildFilterQuery(query);

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        ...query.getPrismaParams(),
        orderBy: { createdAt: 'desc' },
        include: this.getPaymentIncludes(),
      }),
      this.prisma.payment.count({ where }),
    ]);

    return { data: payments, total };
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

  private buildFilterQuery(query: QueryPaymentDto): Prisma.PaymentWhereInput {
    const where: Prisma.PaymentWhereInput = {};

    if (query.paymentCode) {
      where.paymentCode = { contains: query.paymentCode, mode: 'insensitive' };
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.method) {
      where.method = query.method;
    }

    const appointmentFilters: Prisma.AppointmentWhereInput = {};

    if (query.startDate || query.endDate) {
      appointmentFilters.appointmentDate = {};
      if (query.startDate) {
        appointmentFilters.appointmentDate.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        appointmentFilters.appointmentDate.lte = new Date(query.endDate);
      }
    }

    if (query.doctorId) {
      appointmentFilters.doctorId = query.doctorId;
    }

    if (query.patientSearch) {
      appointmentFilters.patient = {
        user: {
          OR: [
            {
              fullName: { contains: query.patientSearch, mode: 'insensitive' },
            },
            { phone: { contains: query.patientSearch } },
          ],
        },
      };
    }

    if (Object.keys(appointmentFilters).length > 0) {
      where.appointment = appointmentFilters;
    }

    return where;
  }

  private getPaymentIncludes() {
    return {
      appointment: {
        select: {
          id: true,
          appointmentDate: true,
          consultationFee: true,
          patient: {
            select: {
              id: true,
              user: {
                select: {
                  fullName: true,
                  phone: true,
                  avatar: true,
                },
              },
            },
          },
          doctor: {
            select: {
              id: true,
              user: {
                select: {
                  fullName: true,
                },
              },
            },
          },
        },
      },
    };
  }
}
