import { Injectable, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CreateDoctorDto, QueryDoctorDto, DoctorResponseDto } from './dto';
import { UserService } from '../user';
import { TransactionUtil } from '../common/utils';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UserRole } from 'src/common/constants';
import { DoctorStatus, Prisma } from '@prisma/client';
import { PaginatedResponse } from '../common/dto';

@Injectable()
export class DoctorService {
  private readonly logger = new Logger(DoctorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  async create(createDoctorDto: CreateDoctorDto) {
    await this.validateData(createDoctorDto);
    const temporaryPassword = this.generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
    this.logger.log(`Generated temporary password for doctor: ${createDoctorDto.email}`);
    const doctor = await TransactionUtil.executeInTransaction(this.prisma, async (tx) => {
      const user = await this.userService.createUserInTransaction(tx, {
        email: createDoctorDto.email,
        password: hashedPassword,
        username: createDoctorDto.username,
        phone: createDoctorDto.phone,
        fullName: createDoctorDto.fullName,
        avatar: createDoctorDto.avatar,
        address: createDoctorDto.address,
        role: UserRole.DOCTOR,
      });
      const educations = createDoctorDto.educations.map((edu) => ({
        school: edu.school,
        degree: edu.degree,
        graduationYear: edu.graduationYear,
      }));
      const certifications = createDoctorDto.certifications.map((cert) => ({
        certificateName: cert.certificateName,
        issuingAuthority: cert.issuingAuthority,
        licenseNumber: cert.licenseNumber,
        issueDate: new Date(cert.issueDate),
        expiryDate: cert.expiryDate ? new Date(cert.expiryDate) : null,
        documentUrl: cert.documentUrl,
      }));
      const awards = createDoctorDto.awards?.map((award) => ({
        title: award.title,
        organization: award.organization,
        year: award.year,
        description: award.description,
      })) || [];
      return tx.doctor.create({
        data: {
          userId: user.id,
          primarySpecialtyId: createDoctorDto.primarySpecialtyId,
          subSpecialty: createDoctorDto.subSpecialty,
          professionalTitle: createDoctorDto.professionalTitle,
          yearsOfExperience: createDoctorDto.yearsOfExperience,
          consultationFee: createDoctorDto.consultationFee,
          bio: createDoctorDto.bio,
          status: createDoctorDto.status || DoctorStatus.ACTIVE,
          educations: {
            create: educations,
          },
          certifications: {
            create: certifications,
          },
          ...(awards.length > 0 && {
            awards: {
              create: awards,
            },
          }),
        },
        include: {
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
            },
          },
          primarySpecialty: true,
          educations: true,
          certifications: true,
          awards: true,
        },
      });
    });
    return {
      ...doctor,
      temporaryPassword,
    };
  }

  private generateTemporaryPassword(): string {
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    const randomBytes = crypto.randomBytes(length);
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset[randomBytes[i] % charset.length];
    }
    return password;
  }

  async findAll(query: QueryDoctorDto) {
    const where: Prisma.DoctorWhereInput = {};
    if (query.name) {
      where.user = {
        fullName: {
          contains: query.name,
          mode: 'insensitive',
        },
      };
    }
    if (query.specialtyId) {
      where.primarySpecialtyId = query.specialtyId;
    }
    if (query.status) {
      where.status = query.status;
    }
    const [doctors, total] = await Promise.all([
      this.prisma.doctor.findMany({
        where,
        ...query.getPrismaParams(),
        orderBy: query.getPrismaSortParams(),
        include: {
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
            },
          },
          primarySpecialty: {
            select: {
              id: true,
              name: true,
              description: true,
              isActive: true,
            },
          },
        },
      }),
      this.prisma.doctor.count({ where }),
    ]);
    const doctorResponses: DoctorResponseDto[] = doctors.map((doctor) => ({
      id: doctor.id,
      userId: doctor.userId,
      user: {
        id: doctor.user.id,
        email: doctor.user.email,
        username: doctor.user.username ?? undefined,
        phone: doctor.user.phone ?? undefined,
        fullName: doctor.user.fullName ?? undefined,
        avatar: doctor.user.avatar ?? undefined,
        address: doctor.user.address ?? undefined,
        role: doctor.user.role,
      },
      primarySpecialtyId: doctor.primarySpecialtyId,
      primarySpecialty: {
        id: doctor.primarySpecialty.id,
        name: doctor.primarySpecialty.name,
        description: doctor.primarySpecialty.description ?? undefined,
        isActive: doctor.primarySpecialty.isActive,
      },
      subSpecialty: doctor.subSpecialty ?? undefined,
      professionalTitle: doctor.professionalTitle ?? undefined,
      yearsOfExperience: doctor.yearsOfExperience,
      consultationFee: doctor.consultationFee,
      bio: doctor.bio ?? undefined,
      status: doctor.status,
      createdAt: doctor.createdAt,
      updatedAt: doctor.updatedAt,
    }));
    return {
      data: doctorResponses,
      total,
    }
  }
  private async validateData(dto: CreateDoctorDto): Promise<void> {
    const [existingUser, specialty] = await Promise.all([
      this.userService.findByEmail(dto.email),
      this.prisma.specialty.findUnique({
        where: { id: dto.primarySpecialtyId },
      }),
    ]);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }
    if (!specialty) {
      throw new NotFoundException('Primary specialty not found');
    }
    if (!specialty.isActive) {
      throw new ConflictException('Primary specialty is not active');
    }
    const licenseNumbers = dto.certifications.map((cert) => cert.licenseNumber);
    const existingCertifications = await this.prisma.doctorCertification.findMany({
      where: {
        licenseNumber: {
          in: licenseNumbers,
        },
      },
    });
    if (existingCertifications.length > 0) {
      const duplicateLicenses = existingCertifications.map((cert) => cert.licenseNumber).join(', ');
      throw new ConflictException(`License number(s) already exist: ${duplicateLicenses}`);
    }
  }
}

