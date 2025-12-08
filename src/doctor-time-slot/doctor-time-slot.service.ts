import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import {
  CreateDoctorScheduleDto,
  QueryDoctorScheduleDto,
  UpdateDoctorScheduleDto,
} from './dto';
import { Prisma, DayOfWeek } from '@prisma/client';

@Injectable()
export class DoctorTimeSlotService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDoctorScheduleDto) {
    await this.validateDoctor(dto.doctorId);
    this.validateTimeSlots(dto.timeSlots);
    await this.checkOverlappingSchedule(
      dto.doctorId,
      dto.startDate,
      dto.endDate,
      dto.daysOfWeek,
    );

    const timeSlotData = dto.daysOfWeek.flatMap((dayOfWeek) =>
      dto.timeSlots.map((slot) => ({
        dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        examinationType: slot.examinationType,
        maxPatients: slot.maxPatients,
      })),
    );

    return this.prisma.doctorSchedule.create({
      data: {
        doctorId: dto.doctorId,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        timezone: dto.timezone || 'Asia/Ho_Chi_Minh',
        timeSlots: {
          create: timeSlotData,
        },
      },
      include: this.getScheduleIncludes(),
    });
  }

  async findAll(query: QueryDoctorScheduleDto) {
    const where = this.buildFilterQuery(query);
    const [schedules, total] = await Promise.all([
      this.prisma.doctorSchedule.findMany({
        where,
        ...query.getPrismaParams(),
        orderBy: query.getPrismaSortParams(),
        include: this.getScheduleIncludes(),
      }),
      this.prisma.doctorSchedule.count({ where }),
    ]);

    return { data: schedules, total };
  }

  async findOne(id: string) {
    const schedule = await this.prisma.doctorSchedule.findUnique({
      where: { id },
      include: this.getScheduleIncludes(),
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    return schedule;
  }

  async findByDoctor(doctorId: string, query: QueryDoctorScheduleDto) {
    await this.validateDoctor(doctorId);
    const where: Prisma.DoctorScheduleWhereInput = {
      doctorId,
      ...this.buildFilterQuery(query),
    };

    const [schedules, total] = await Promise.all([
      this.prisma.doctorSchedule.findMany({
        where,
        ...query.getPrismaParams(),
        orderBy: query.getPrismaSortParams(),
        include: this.getScheduleIncludes(),
      }),
      this.prisma.doctorSchedule.count({ where }),
    ]);

    return { data: schedules, total };
  }

  async update(id: string, dto: UpdateDoctorScheduleDto) {
    const schedule = await this.findOne(id);

    if (dto.timeSlots) {
      this.validateTimeSlots(dto.timeSlots);
    }

    if (dto.startDate || dto.endDate || dto.daysOfWeek) {
      const daysOfWeek = dto.daysOfWeek || [
        ...new Set(schedule.timeSlots.map((ts) => ts.dayOfWeek)),
      ];
      await this.checkOverlappingSchedule(
        schedule.doctorId,
        dto.startDate || schedule.startDate.toISOString().split('T')[0],
        dto.endDate || schedule.endDate.toISOString().split('T')[0],
        daysOfWeek,
        id,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.timeSlots && dto.daysOfWeek) {
        await tx.doctorTimeSlot.deleteMany({
          where: { scheduleId: id },
        });

        const timeSlotData = dto.daysOfWeek.flatMap((dayOfWeek) =>
          dto.timeSlots!.map((slot) => ({
            scheduleId: id,
            dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            examinationType: slot.examinationType,
            maxPatients: slot.maxPatients,
          })),
        );

        await tx.doctorTimeSlot.createMany({ data: timeSlotData });
      }

      return tx.doctorSchedule.update({
        where: { id },
        data: {
          ...(dto.startDate && { startDate: new Date(dto.startDate) }),
          ...(dto.endDate && { endDate: new Date(dto.endDate) }),
          ...(dto.timezone && { timezone: dto.timezone }),
          ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        },
        include: this.getScheduleIncludes(),
      });
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.doctorSchedule.delete({
      where: { id },
      include: this.getScheduleIncludes(),
    });
  }

  async getAvailableSlots(doctorId: string, date: string) {
    await this.validateDoctor(doctorId);
    const targetDate = new Date(date);
    const dayOfWeek = this.getDayOfWeek(targetDate);

    const schedules = await this.prisma.doctorSchedule.findMany({
      where: {
        doctorId,
        isActive: true,
        startDate: { lte: targetDate },
        endDate: { gte: targetDate },
      },
      include: {
        timeSlots: {
          where: { dayOfWeek },
        },
      },
    });

    return schedules.flatMap((schedule) =>
      schedule.timeSlots.map((slot) => ({
        scheduleId: schedule.id,
        slotId: slot.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        examinationType: slot.examinationType,
        maxPatients: slot.maxPatients,
        timezone: schedule.timezone,
      })),
    );
  }

  private async validateDoctor(doctorId: string): Promise<void> {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }
  }

  private validateTimeSlots(
    timeSlots: { startTime: string; endTime: string }[],
  ): void {
    for (const slot of timeSlots) {
      const [startHour, startMin] = slot.startTime.split(':').map(Number);
      const [endHour, endMin] = slot.endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (startMinutes >= endMinutes) {
        throw new BadRequestException(
          `End time (${slot.endTime}) must be after start time (${slot.startTime})`,
        );
      }
    }

    for (let i = 0; i < timeSlots.length; i++) {
      for (let j = i + 1; j < timeSlots.length; j++) {
        if (this.isOverlapping(timeSlots[i], timeSlots[j])) {
          throw new BadRequestException(
            `Time slots ${timeSlots[i].startTime}-${timeSlots[i].endTime} and ${timeSlots[j].startTime}-${timeSlots[j].endTime} are overlapping`,
          );
        }
      }
    }
  }

  private isOverlapping(
    slot1: { startTime: string; endTime: string },
    slot2: { startTime: string; endTime: string },
  ): boolean {
    const toMinutes = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };

    const start1 = toMinutes(slot1.startTime);
    const end1 = toMinutes(slot1.endTime);
    const start2 = toMinutes(slot2.startTime);
    const end2 = toMinutes(slot2.endTime);

    return start1 < end2 && start2 < end1;
  }

  private async checkOverlappingSchedule(
    doctorId: string,
    startDate: string,
    endDate: string,
    daysOfWeek: DayOfWeek[],
    excludeId?: string,
  ): Promise<void> {
    const existingSchedules = await this.prisma.doctorSchedule.findMany({
      where: {
        doctorId,
        isActive: true,
        ...(excludeId && { id: { not: excludeId } }),
        OR: [
          {
            startDate: { lte: new Date(endDate) },
            endDate: { gte: new Date(startDate) },
          },
        ],
      },
      include: {
        timeSlots: true,
      },
    });

    for (const schedule of existingSchedules) {
      const existingDays = new Set(
        schedule.timeSlots.map((ts) => ts.dayOfWeek),
      );
      const overlappingDays = daysOfWeek.filter((day) => existingDays.has(day));

      if (overlappingDays.length > 0) {
        throw new ConflictException(
          `Schedule already exists for days: ${overlappingDays.join(', ')} within the date range`,
        );
      }
    }
  }

  private buildFilterQuery(
    query: QueryDoctorScheduleDto,
  ): Prisma.DoctorScheduleWhereInput {
    const where: Prisma.DoctorScheduleWhereInput = {};

    if (query.doctorId) {
      where.doctorId = query.doctorId;
    }

    if (query.startDateFrom || query.startDateTo) {
      where.startDate = {};
      if (query.startDateFrom) {
        where.startDate.gte = new Date(query.startDateFrom);
      }
      if (query.startDateTo) {
        where.startDate.lte = new Date(query.startDateTo);
      }
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    return where;
  }

  private getScheduleIncludes() {
    return {
      doctor: {
        select: {
          id: true,
          user: {
            select: {
              id: true,
              fullName: true,
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
      timeSlots: {
        orderBy: [{ dayOfWeek: 'asc' as const }, { startTime: 'asc' as const }],
      },
    };
  }

  private getDayOfWeek(date: Date): DayOfWeek {
    const days: DayOfWeek[] = [
      DayOfWeek.SUNDAY,
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY,
    ];
    return days[date.getDay()];
  }
}
