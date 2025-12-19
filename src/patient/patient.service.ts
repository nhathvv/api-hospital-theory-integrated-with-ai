import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { UpdatePatientDto, QueryPatientDto } from './dto';
import { Prisma } from '@prisma/client';
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
    return this.prisma.patient.findUnique({
      where: { userId },
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

  async updateMyProfile(userId: string, updatePatientDto: UpdatePatientDto) {
    const patient = await this.prisma.patient.findUnique({
      where: { userId },
    });

    if (!patient) {
      throw new NotFoundException('Patient profile not found');
    }

    const { fullName, phone, address, avatar, ...patientData } = updatePatientDto;

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
          ...(patientData.dateOfBirth && { dateOfBirth: new Date(patientData.dateOfBirth) }),
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
