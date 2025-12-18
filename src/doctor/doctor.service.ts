import { Injectable, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CreateDoctorDto, QueryDoctorDto } from './dto';
import { UserService } from '../user';
import { TransactionUtils } from '../common/utils';
import * as bcrypt from 'bcrypt';
import { UserRole } from 'src/common/constants';
import { DoctorStatus, Prisma, DayOfWeek } from '@prisma/client';
import { EnvService } from '../configs/envs/env-service';

@Injectable()
export class DoctorService {
  private readonly logger = new Logger(DoctorService.name);
  private readonly envService = EnvService.getInstance();

  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  async create(createDoctorDto: CreateDoctorDto) {
    await this.validateData(createDoctorDto);
    const defaultPassword = this.envService.getDefaultPassword();
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    this.logger.log(`Created doctor account with default password: ${createDoctorDto.email}`);
    const doctor = await TransactionUtils.executeInTransaction(this.prisma, async (tx) => {
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
      defaultPassword,
    };
  }
  
  async findAll(query: QueryDoctorDto) {
    const where = this.buildFilterQuery(query);
    const [doctors, total] = await Promise.all([
      this.prisma.doctor.findMany({
        where,
        ...query.getPrismaParams(),
        orderBy: query.getPrismaSortParams(),
        include: this.getDoctorIncludes(),
      }),
      this.prisma.doctor.count({ where }),
    ]);
    return {
      data: doctors,
      total,
    }
  }

  async findOne(id: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
      include: this.getDoctorDetailIncludes(),
    });
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }
    return this.formatDoctorDetailResponse(doctor);
  }

  private formatDoctorDetailResponse(doctor: any) {
    const formattedSchedules = doctor.schedules?.map((schedule: any) => ({
      ...schedule,
      startDate: this.formatDate(schedule.startDate),
      endDate: this.formatDate(schedule.endDate),
      timeSlots: schedule.timeSlots?.map((slot: any) => ({
        ...slot,
        availableDates: this.getAvailableDates(
          schedule.startDate,
          schedule.endDate,
          slot.dayOfWeek,
        ),
      })),
    }));

    return {
      ...doctor,
      schedules: formattedSchedules,
    };
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private getAvailableDates(startDate: Date, endDate: Date, dayOfWeek: DayOfWeek): string[] {
    const dayOfWeekMap: Record<DayOfWeek, number> = {
      [DayOfWeek.SUNDAY]: 0,
      [DayOfWeek.MONDAY]: 1,
      [DayOfWeek.TUESDAY]: 2,
      [DayOfWeek.WEDNESDAY]: 3,
      [DayOfWeek.THURSDAY]: 4,
      [DayOfWeek.FRIDAY]: 5,
      [DayOfWeek.SATURDAY]: 6,
    };

    const dates: string[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(startDate);
    const end = new Date(endDate);
    const targetDay = dayOfWeekMap[dayOfWeek];

    let current = new Date(Math.max(start.getTime(), today.getTime()));
    
    const daysUntilTarget = (targetDay - current.getDay() + 7) % 7;
    current.setDate(current.getDate() + daysUntilTarget);

    while (current <= end && dates.length < 8) {
      dates.push(this.formatDate(current));
      current.setDate(current.getDate() + 7);
    }

    return dates;
  }

  async getProfileByUserId(userId: string) {
    return this.prisma.doctor.findUnique({
      where: { userId },
      select: {
        id: true,
        primarySpecialty: { select: { id: true, name: true } },
        subSpecialty: true,
        professionalTitle: true,
        yearsOfExperience: true,
        consultationFee: true,
        bio: true,
        status: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.doctor.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private buildFilterQuery(query: QueryDoctorDto): Prisma.DoctorWhereInput {
    const where: Prisma.DoctorWhereInput = {
      deletedAt: null,
    };
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
    return where;
  }

  private getDoctorIncludes() {
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
    };
  }

  private getDoctorDetailIncludes() {
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
          createdAt: true,
        },
      },
      primarySpecialty: {
        select: {
          id: true,
          name: true,
          description: true,
          isActive: true,
          department: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      educations: {
        orderBy: { graduationYear: 'desc' as const },
      },
      certifications: {
        orderBy: { issueDate: 'desc' as const },
      },
      awards: {
        orderBy: { year: 'desc' as const },
      },
      headOfDepartment: {
        select: {
          id: true,
          name: true,
        },
      },
      schedules: {
        where: { isActive: true },
        orderBy: { startDate: 'desc' as const },
        select: {
          id: true,
          startDate: true,
          endDate: true,
          timezone: true,
          isActive: true,
          timeSlots: {
            orderBy: [
              { dayOfWeek: 'asc' as const },
              { startTime: 'asc' as const },
            ],
            select: {
              id: true,
              dayOfWeek: true,
              startTime: true,
              endTime: true,
              examinationType: true,
              maxPatients: true,
            },
          },
        },
      },
    };
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

