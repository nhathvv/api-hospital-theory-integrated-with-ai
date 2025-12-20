import { Injectable } from '@nestjs/common';
import {
  WebhookPaymentBodyDto,
  QueryPaymentDto,
  QueryMyPaymentDto,
} from '../dto';
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

  async findOne(id: string) {
    return this.prisma.payment.findUnique({
      where: { id },
      include: this.getPaymentDetailIncludes(),
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


  async findByPatientId(patientId: string, query: QueryMyPaymentDto) {
    const where = this.buildPatientFilterQuery(patientId, query);

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        ...query.getPrismaParams(),
        orderBy: { createdAt: 'desc' },
        include: this.getPatientPaymentIncludes(),
      }),
      this.prisma.payment.count({ where }),
    ]);

    return { data: payments, total };
  }

  async findOneByPatient(id: string, patientId: string) {
    return this.prisma.payment.findFirst({
      where: {
        id,
        appointment: { patientId },
      },
      include: this.getPatientPaymentDetailIncludes(),
    });
  }

  private buildPatientFilterQuery(
    patientId: string,
    query: QueryMyPaymentDto,
  ): Prisma.PaymentWhereInput {
    const appointmentFilters: Prisma.AppointmentWhereInput = { patientId };

    if (query.startDate || query.endDate) {
      appointmentFilters.appointmentDate = {};
      if (query.startDate) {
        appointmentFilters.appointmentDate.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        appointmentFilters.appointmentDate.lte = new Date(query.endDate);
      }
    }

    return {
      ...(query.status && { status: query.status }),
      appointment: appointmentFilters,
    };
  }

  private getPatientPaymentIncludes() {
    return {
      appointment: {
        select: {
          id: true,
          appointmentDate: true,
          consultationFee: true,
          status: true,
          examinationType: true,
          doctor: {
            select: {
              id: true,
              professionalTitle: true,
              user: { select: { fullName: true, avatar: true } },
              primarySpecialty: { select: { name: true } },
            },
          },
        },
      },
    };
  }

  private getPatientPaymentDetailIncludes() {
    return {
      appointment: {
        select: {
          id: true,
          appointmentDate: true,
          consultationFee: true,
          status: true,
          examinationType: true,
          symptoms: true,
          notes: true,
          diagnosis: true,
          createdAt: true,
          completedAt: true,
          timeSlot: {
            select: {
              startTime: true,
              endTime: true,
              dayOfWeek: true,
            },
          },
          doctor: {
            select: {
              id: true,
              professionalTitle: true,
              user: { select: { fullName: true, avatar: true, phone: true } },
              primarySpecialty: { select: { name: true } },
            },
          },
        },
      },
    };
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

  private getPaymentDetailIncludes() {
    return {
      appointment: {
        select: {
          id: true,
          appointmentDate: true,
          consultationFee: true,
          status: true,
          examinationType: true,
          symptoms: true,
          notes: true,
          createdAt: true,
          patient: {
            select: {
              id: true,
              user: {
                select: {
                  fullName: true,
                  phone: true,
                  email: true,
                  avatar: true,
                },
              },
            },
          },
          doctor: {
            select: {
              id: true,
              professionalTitle: true,
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
