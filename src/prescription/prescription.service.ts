import { Injectable, Logger } from '@nestjs/common';
import { AppointmentStatus, BatchStatus } from '@prisma/client';
import { PrismaService } from '../prisma';
import { ExceptionUtils } from '../common/utils';
import { UpdatePrescriptionDto, CreatePrescriptionItemDto } from './dto';

@Injectable()
export class PrescriptionService {
  private readonly logger = new Logger(PrescriptionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createPrescription(
    appointmentId: string,
    doctorId: string,
    dto: UpdatePrescriptionDto,
  ) {
    const appointment = await this.validateAppointment(appointmentId, doctorId);
    const batches = await this.validateAndGetBatches(dto.items);
    return this.executePrescriptionTransaction(appointment, dto.items, batches);
  }

  async getPrescription(appointmentId: string) {
    return this.prisma.prescriptionItem.findMany({
      where: { appointmentId },
      include: {
        medicineBatch: {
          include: {
            medicine: true,
          },
        },
      },
    });
  }

  private async validateAppointment(appointmentId: string, doctorId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { doctor: true },
    });

    if (!appointment) {
      ExceptionUtils.throwNotFound('Appointment', appointmentId);
    }

    if (appointment.doctorId !== doctorId) {
      ExceptionUtils.throwForbidden(
        'You are not authorized to update this appointment',
      );
    }

    const allowedStatuses: AppointmentStatus[] = [
      AppointmentStatus.CONFIRMED,
      AppointmentStatus.IN_PROGRESS,
      AppointmentStatus.COMPLETED,
    ];

    if (!allowedStatuses.includes(appointment.status)) {
      ExceptionUtils.throwBadRequest(
        `Cannot add prescription to appointment with status ${appointment.status}`,
      );
    }

    return appointment;
  }

  private async validateAndGetBatches(items: CreatePrescriptionItemDto[]) {
    const batchIds = items.map((item) => item.medicineBatchId);
    const batches = await this.prisma.medicineBatch.findMany({
      where: {
        id: { in: batchIds },
        deletedAt: null,
      },
      include: { medicine: true },
    });

    const batchMap = new Map(batches.map((b) => [b.id, b]));

    for (const item of items) {
      const batch = batchMap.get(item.medicineBatchId);

      if (!batch) {
        ExceptionUtils.throwNotFound('Medicine batch', item.medicineBatchId);
      }

      if (batch.status === BatchStatus.OUT_OF_STOCK) {
        ExceptionUtils.throwBadRequest(
          `Medicine batch ${batch.batchNumber} is out of stock`,
        );
      }

      if (batch.status === BatchStatus.EXPIRED) {
        ExceptionUtils.throwBadRequest(
          `Medicine batch ${batch.batchNumber} has expired`,
        );
      }

      if (batch.currentStock < item.quantity) {
        ExceptionUtils.throwBadRequest(
          `Insufficient stock for ${batch.medicine.name}. Available: ${batch.currentStock}, Requested: ${item.quantity}`,
        );
      }
    }

    return batches;
  }

  private async executePrescriptionTransaction(
    appointment: { id: string; consultationFee: number | null },
    items: CreatePrescriptionItemDto[],
    batches: Array<{ id: string; sellingPrice: number; currentStock: number }>,
  ) {
    const batchMap = new Map(batches.map((b) => [b.id, b]));

    return this.prisma.$transaction(async (tx) => {
      const existingItems = await tx.prescriptionItem.findMany({
        where: { appointmentId: appointment.id },
      });

      for (const existingItem of existingItems) {
        await tx.medicineBatch.update({
          where: { id: existingItem.medicineBatchId },
          data: {
            currentStock: { increment: existingItem.quantity },
          },
        });
      }

      await tx.prescriptionItem.deleteMany({
        where: { appointmentId: appointment.id },
      });

      let totalMedicineFee = 0;

      for (const item of items) {
        const batch = batchMap.get(item.medicineBatchId)!;
        const itemTotal = batch.sellingPrice * item.quantity;
        totalMedicineFee += itemTotal;

        await tx.prescriptionItem.create({
          data: {
            appointmentId: appointment.id,
            medicineBatchId: item.medicineBatchId,
            quantity: item.quantity,
            dosage: item.dosage,
            instructions: item.instructions,
            unitPrice: batch.sellingPrice,
            totalPrice: itemTotal,
          },
        });

        await tx.medicineBatch.update({
          where: { id: item.medicineBatchId },
          data: {
            currentStock: { decrement: item.quantity },
          },
        });
      }

      const consultationFee = appointment.consultationFee || 0;
      const totalFee = consultationFee + totalMedicineFee;

      const updatedAppointment = await tx.appointment.update({
        where: { id: appointment.id },
        data: {
          medicineFee: totalMedicineFee,
          totalFee,
        },
        include: {
          prescriptionItems: {
            include: {
              medicineBatch: {
                include: { medicine: true },
              },
            },
          },
          doctor: {
            include: {
              user: {
                select: {
                  fullName: true,
                  email: true,
                },
              },
              primarySpecialty: true,
            },
          },
          patient: {
            include: {
              user: {
                select: {
                  fullName: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
        },
      });

      this.logger.log(
        `Prescription updated for appointment ${appointment.id}. Medicine fee: ${totalMedicineFee}, Total fee: ${totalFee}`,
      );

      await this.updateBatchStatuses(
        tx,
        items.map((i) => i.medicineBatchId),
      );

      return this.formatPrescriptionResponse(updatedAppointment);
    });
  }

  private async updateBatchStatuses(
    tx: Parameters<Parameters<typeof this.prisma.$transaction>[0]>[0],
    batchIds: string[],
  ) {
    for (const batchId of batchIds) {
      const batch = await tx.medicineBatch.findUnique({
        where: { id: batchId },
        include: { medicine: true },
      });

      if (!batch) continue;

      let newStatus = batch.status;

      if (batch.currentStock === 0) {
        newStatus = BatchStatus.OUT_OF_STOCK;
      } else if (batch.currentStock <= batch.medicine.lowStockThreshold) {
        newStatus = BatchStatus.LOW_STOCK;
      } else if (
        batch.status === BatchStatus.OUT_OF_STOCK ||
        batch.status === BatchStatus.LOW_STOCK
      ) {
        newStatus = BatchStatus.IN_STOCK;
      }

      if (newStatus !== batch.status) {
        await tx.medicineBatch.update({
          where: { id: batchId },
          data: { status: newStatus },
        });
      }
    }
  }

  private formatPrescriptionResponse(appointment: {
    id: string;
    consultationFee: number | null;
    medicineFee: number;
    totalFee: number;
    doctor: {
      id: string;
      user: { fullName: string | null };
      primarySpecialty: { name: string };
    };
    patient: {
      id: string;
      user: { fullName: string | null; phone: string | null };
    };
    prescriptionItems: Array<{
      id: string;
      quantity: number;
      dosage: string;
      instructions: string | null;
      unitPrice: number;
      totalPrice: number;
      medicineBatch: {
        batchNumber: string;
        medicine: { name: string };
      };
    }>;
  }) {
    return {
      id: appointment.id,
      consultationFee: appointment.consultationFee,
      medicineFee: appointment.medicineFee,
      totalFee: appointment.totalFee,
      doctor: {
        id: appointment.doctor.id,
        fullName: appointment.doctor.user.fullName,
        specialty: appointment.doctor.primarySpecialty.name,
      },
      patient: {
        id: appointment.patient.id,
        fullName: appointment.patient.user.fullName,
        phone: appointment.patient.user.phone,
      },
      prescriptionItems: appointment.prescriptionItems.map((item) => ({
        id: item.id,
        medicineName: item.medicineBatch.medicine.name,
        batchNumber: item.medicineBatch.batchNumber,
        quantity: item.quantity,
        dosage: item.dosage,
        instructions: item.instructions,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })),
    };
  }
}
