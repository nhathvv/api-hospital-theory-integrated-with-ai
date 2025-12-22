import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma';
import {
  UpdatePatientDto,
  QueryPatientDto,
  QueryConsultationHistoryDto,
} from './dto';
import { AppointmentStatus, Prisma } from '@prisma/client';
import { TransactionUtils } from '../common/utils';

@Injectable()
export class PatientService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyProfile(userId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { userId },
      include: this.getPatientIncludes(),
    });

    if (!patient) {
      throw new NotFoundException('Patient profile not found');
    }

    return patient;
  }

  async getProfileByUserId(userId: string) {
    return this.prisma.patient.findFirst({
      where: { userId, deletedAt: null },
      select: {
        id: true,
        height: true,
        weight: true,
        bloodType: true,
        allergies: true,
        dateOfBirth: true,
        gender: true,
        healthInsuranceNumber: true,
        emergencyContact: true,
        identityNumber: true,
        chronicDisease: true,
      },
    });
  }

  async getOrCreatePatientByUserId(userId: string) {
    let patient = await this.prisma.patient.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true },
    });

    if (!patient) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
      });

      if (user && user.role === 'PATIENT') {
        patient = await this.prisma.patient.create({
          data: { userId },
          select: { id: true },
        });
      }
    }

    return patient;
  }

  async updateMyProfile(userId: string, updatePatientDto: UpdatePatientDto) {
    const patient = await this.prisma.patient.findUnique({
      where: { userId },
    });

    if (!patient) {
      throw new NotFoundException('Patient profile not found');
    }

    const { fullName, phone, address, avatar, ...patientData } =
      updatePatientDto;

    return TransactionUtils.executeInTransaction(this.prisma, async (tx) => {
      if (fullName || phone || address || avatar) {
        await tx.user.update({
          where: { id: userId },
          data: {
            ...(fullName && { fullName }),
            ...(phone && { phone }),
            ...(address && { address }),
            ...(avatar && { avatar }),
          },
        });
      }

      return tx.patient.update({
        where: { userId },
        data: {
          ...patientData,
          ...(patientData.dateOfBirth && {
            dateOfBirth: new Date(patientData.dateOfBirth),
          }),
        },
        include: this.getPatientIncludes(),
      });
    });
  }

  async findAll(query: QueryPatientDto) {
    const where = this.buildFilterQuery(query);

    const [patients, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        ...query.getPrismaParams(),
        orderBy: query.getPrismaSortParams(),
        include: this.getPatientIncludes(),
      }),
      this.prisma.patient.count({ where }),
    ]);

    return {
      data: patients,
      total,
    };
  }

  async findOne(id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: this.getPatientDetailIncludes(),
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return patient;
  }

  async findMyConsultationHistory(
    patientId: string,
    query: QueryConsultationHistoryDto,
  ) {
    const where = this.buildConsultationHistoryFilter(patientId, query);

    const [consultations, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        ...query.getPrismaParams(),
        orderBy: { appointmentDate: 'desc' },
        include: this.getConsultationHistoryIncludes(),
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return { data: consultations, total };
  }

  async findConsultationById(patientId: string, appointmentId: string) {
    const consultation = await this.prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        patientId,
        status: 'COMPLETED',
      },
      include: this.getConsultationDetailIncludes(),
    });

    if (!consultation) {
      throw new NotFoundException('Consultation not found');
    }

    return consultation;
  }

  private buildConsultationHistoryFilter(
    patientId: string,
    query: QueryConsultationHistoryDto,
  ): Prisma.AppointmentWhereInput {
    const where: Prisma.AppointmentWhereInput = {
      patientId,
      status: { in: [AppointmentStatus.COMPLETED, AppointmentStatus.IN_PROGRESS] },
    };

    if (query.startDate || query.endDate) {
      where.appointmentDate = {};
      if (query.startDate) {
        where.appointmentDate.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.appointmentDate.lte = new Date(query.endDate);
      }
    }

    if (query.doctorId) {
      where.doctorId = query.doctorId;
    }

    if (query.keyword) {
      where.diagnosis = { contains: query.keyword, mode: 'insensitive' };
    }

    return where;
  }

  private getConsultationHistoryIncludes() {
    return {
      doctor: {
        select: {
          id: true,
          professionalTitle: true,
          user: {
            select: {
              fullName: true,
              avatar: true,
            },
          },
          primarySpecialty: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      timeSlot: {
        select: {
          startTime: true,
          endTime: true,
        },
      },
    };
  }

  private getConsultationDetailIncludes() {
    return {
      doctor: {
        select: {
          id: true,
          professionalTitle: true,
          bio: true,
          user: {
            select: {
              fullName: true,
              avatar: true,
              phone: true,
              email: true,
            },
          },
          primarySpecialty: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      timeSlot: {
        select: {
          startTime: true,
          endTime: true,
          dayOfWeek: true,
          examinationType: true,
        },
      },
      prescriptionItems: {
        select: {
          id: true,
          quantity: true,
          dosage: true,
          instructions: true,
          unitPrice: true,
          totalPrice: true,
          medicineBatch: {
            select: {
              id: true,
              batchNumber: true,
              medicine: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  unit: true,
                  dosage: true,
                  activeIngredient: true,
                },
              },
            },
          },
        },
      },
      documents: {
        select: {
          id: true,
          title: true,
          documentType: true,
          documentUrl: true,
          notes: true,
          createdAt: true,
        },
      },
      payment: {
        select: {
          id: true,
          paymentCode: true,
          status: true,
          method: true,
          createdAt: true,
        },
      },
    };
  }

  private buildFilterQuery(query: QueryPatientDto): Prisma.PatientWhereInput {
    const where: Prisma.PatientWhereInput = {
      deletedAt: null,
    };

    if (query.keyword) {
      where.user = {
        OR: [
          { fullName: { contains: query.keyword, mode: 'insensitive' } },
          { email: { contains: query.keyword, mode: 'insensitive' } },
          { phone: { contains: query.keyword } },
        ],
      };
    }

    if (query.gender) {
      where.gender = query.gender;
    }

    if (query.bloodType) {
      where.bloodType = query.bloodType;
    }

    return where;
  }

  private getPatientIncludes() {
    return {
      user: {
        select: {
          id: true,
          email: true,
          username: true,
          phone: true,
          fullName: true,
          avatar: true,
          address: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      },
    };
  }

  private getPatientDetailIncludes() {
    return {
      user: {
        select: {
          id: true,
          email: true,
          username: true,
          phone: true,
          fullName: true,
          avatar: true,
          address: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    };
  }
}
