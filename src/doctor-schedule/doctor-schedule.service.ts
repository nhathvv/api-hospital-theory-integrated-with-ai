import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import { DayOfWeek } from '@prisma/client';
import {
  CreateDoctorScheduleDto,
  UpdateDoctorScheduleDto,
  QueryDoctorScheduleDto,
  QueryAvailableSlotsDto,
  TimeSlotDto,
} from './dto';

@Injectable()
export class DoctorScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateDoctorScheduleDto) {
    await this.validateDoctor(createDto.doctorId);
    const daysOfWeek =
      createDto.daysOfWeek ?? this.extractDaysOfWeek(createDto.timeSlots);
    this.validateTimeSlots(createDto.timeSlots, createDto.daysOfWeek);
    this.validateDaysExistInDateRange(
      createDto.startDate,
      createDto.endDate,
      daysOfWeek,
    );
    await this.checkOverlappingSchedule(
      createDto.doctorId,
      createDto.startDate,
      createDto.endDate,
      daysOfWeek,
    );

    return this.prisma.doctorSchedule.create({
      data: {
        doctorId: createDto.doctorId,
        startDate: new Date(createDto.startDate),
        endDate: new Date(createDto.endDate),
        timezone: createDto.timezone ?? 'Asia/Ho_Chi_Minh',
        isActive: createDto.isActive ?? true,
        timeSlots: {
          create: createDto.timeSlots.map((slot) => ({
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            examinationType: slot.examinationType ?? 'IN_PERSON',
            maxPatients: slot.maxPatients ?? 10,
          })),
        },
      },
      include: {
        doctor: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
        timeSlots: true,
      },
    });
  }

  async findAll(query: QueryDoctorScheduleDto) {
    const { doctorId, startDateFrom, startDateTo, isActive } = query;
    const where: any = {};

    if (doctorId) {
      where.doctorId = doctorId;
    }
    if (startDateFrom || startDateTo) {
      where.startDate = {};
      if (startDateFrom) {
        where.startDate.gte = new Date(startDateFrom);
      }
      if (startDateTo) {
        where.startDate.lte = new Date(startDateTo);
      }
    }
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [schedules, total] = await Promise.all([
      this.prisma.doctorSchedule.findMany({
        where,
        include: {
          doctor: {
            include: {
              user: { select: { id: true, fullName: true, email: true } },
            },
          },
          timeSlots: true,
        },
        ...query.getPrismaParams(),
        orderBy: query.getPrismaSortParams(),
      }),
      this.prisma.doctorSchedule.count({ where }),
    ]);

    return { data: schedules, total, query };
  }

  async findOne(id: string) {
    const schedule = await this.prisma.doctorSchedule.findUnique({
      where: { id },
      include: {
        doctor: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
        timeSlots: true,
      },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }
    return schedule;
  }

  async findByDoctorId(doctorId: string) {
    await this.validateDoctor(doctorId);

    return this.prisma.doctorSchedule.findMany({
      where: { doctorId, isActive: true },
      include: {
        doctor: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
        timeSlots: true,
      },
      orderBy: { startDate: 'asc' },
    });
  }

  async getAvailableSlots(doctorId: string, query: QueryAvailableSlotsDto) {
    await this.validateDoctor(doctorId);

    const targetDate = query.date ? new Date(query.date) : new Date();
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

  async update(id: string, updateDto: UpdateDoctorScheduleDto) {
    const existing = await this.findOne(id);
    const startDate =
      updateDto.startDate ?? existing.startDate.toISOString().split('T')[0];
    const endDate =
      updateDto.endDate ?? existing.endDate.toISOString().split('T')[0];
    const daysOfWeek =
      updateDto.daysOfWeek ??
      (updateDto.timeSlots
        ? this.extractDaysOfWeek(updateDto.timeSlots)
        : this.extractDaysOfWeek(existing.timeSlots));

    if (updateDto.timeSlots) {
      this.validateTimeSlots(updateDto.timeSlots, updateDto.daysOfWeek);
    }

    if (
      updateDto.startDate ||
      updateDto.endDate ||
      updateDto.timeSlots ||
      updateDto.daysOfWeek
    ) {
      this.validateDaysExistInDateRange(startDate, endDate, daysOfWeek);
      await this.checkOverlappingSchedule(
        existing.doctorId,
        startDate,
        endDate,
        daysOfWeek,
        id,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      if (updateDto.timeSlots) {
        await tx.doctorTimeSlot.deleteMany({ where: { scheduleId: id } });
        await tx.doctorTimeSlot.createMany({
          data: updateDto.timeSlots.map((slot) => ({
            scheduleId: id,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            examinationType: slot.examinationType ?? 'IN_PERSON',
            maxPatients: slot.maxPatients ?? 10,
          })),
        });
      }

      return tx.doctorSchedule.update({
        where: { id },
        data: {
          ...(updateDto.startDate && {
            startDate: new Date(updateDto.startDate),
          }),
          ...(updateDto.endDate && { endDate: new Date(updateDto.endDate) }),
          ...(updateDto.timezone && { timezone: updateDto.timezone }),
          ...(updateDto.isActive !== undefined && {
            isActive: updateDto.isActive,
          }),
        },
        include: {
          doctor: {
            include: {
              user: { select: { id: true, fullName: true, email: true } },
            },
          },
          timeSlots: true,
        },
      });
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.doctorSchedule.delete({ where: { id } });
  }

  private async validateDoctor(doctorId: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId, deletedAt: null },
    });
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }
  }

  private validateTimeSlots(
    timeSlots: TimeSlotDto[],
    daysOfWeek?: DayOfWeek[],
  ) {
    for (const slot of timeSlots) {
      if (slot.startTime >= slot.endTime) {
        throw new BadRequestException(
          `Invalid time slot: endTime (${slot.endTime}) must be after startTime (${slot.startTime})`,
        );
      }
    }

    const slotsByDay = new Map<DayOfWeek, TimeSlotDto[]>();
    for (const slot of timeSlots) {
      const daySlots = slotsByDay.get(slot.dayOfWeek) || [];
      daySlots.push(slot);
      slotsByDay.set(slot.dayOfWeek, daySlots);
    }

    if (daysOfWeek) {
      const slotDays = new Set(timeSlots.map((slot) => slot.dayOfWeek));
      const invalidDays = [...slotDays].filter(
        (day) => !daysOfWeek.includes(day),
      );
      if (invalidDays.length > 0) {
        throw new BadRequestException(
          `Time slots contain invalid days: ${invalidDays.join(', ')}. Allowed days: ${daysOfWeek.join(', ')}`,
        );
      }

      const missingDays = daysOfWeek.filter((day) => !slotDays.has(day));
      if (missingDays.length > 0) {
        throw new BadRequestException(
          `Missing time slots for days: ${missingDays.join(', ')}. Each day in daysOfWeek must have at least one time slot`,
        );
      }
    }

    for (const [day, daySlots] of slotsByDay) {
      const sorted = daySlots.sort((a, b) =>
        a.startTime.localeCompare(b.startTime),
      );
      for (let i = 0; i < sorted.length - 1; i++) {
        if (sorted[i].endTime > sorted[i + 1].startTime) {
          throw new BadRequestException(
            `Overlapping time slots on ${day}: ${sorted[i].startTime}-${sorted[i].endTime} and ${sorted[i + 1].startTime}-${sorted[i + 1].endTime}`,
          );
        }
      }
    }
  }

  private validateDaysExistInDateRange(
    startDate: string,
    endDate: string,
    daysOfWeek: DayOfWeek[],
  ) {
    const daysInRange = new Set<DayOfWeek>();
    const start = new Date(startDate);
    const end = new Date(endDate);
    const current = new Date(start);

    while (current <= end) {
      daysInRange.add(this.getDayOfWeek(current));
      current.setDate(current.getDate() + 1);
      if (daysInRange.size === 7) break;
    }

    const invalidDays = daysOfWeek.filter((day) => !daysInRange.has(day));
    if (invalidDays.length > 0) {
      throw new BadRequestException(
        `Days [${invalidDays.join(', ')}] do not exist in date range ${startDate} to ${endDate}`,
      );
    }
  }

  private async checkOverlappingSchedule(
    doctorId: string,
    startDate: string,
    endDate: string,
    daysOfWeek: DayOfWeek[],
    excludeId?: string,
  ) {
    const existingSchedules = await this.prisma.doctorSchedule.findMany({
      where: {
        doctorId,
        isActive: true,
        id: excludeId ? { not: excludeId } : undefined,
        OR: [
          {
            startDate: { lte: new Date(endDate) },
            endDate: { gte: new Date(startDate) },
          },
        ],
      },
      include: { timeSlots: true },
    });

    for (const schedule of existingSchedules) {
      const existingDays = new Set(
        schedule.timeSlots.map((slot) => slot.dayOfWeek),
      );
      const overlappingDays = daysOfWeek.filter((day) => existingDays.has(day));
      if (overlappingDays.length > 0) {
        throw new ConflictException(
          `Schedule conflict: Doctor already has schedule on ${overlappingDays.join(', ')} during this period`,
        );
      }
    }
  }

  private getDayOfWeek(date: Date): DayOfWeek {
    const days: DayOfWeek[] = [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ];
    return days[date.getDay()];
  }

  private extractDaysOfWeek(
    timeSlots: { dayOfWeek: DayOfWeek }[],
  ): DayOfWeek[] {
    return [...new Set(timeSlots.map((slot) => slot.dayOfWeek))];
  }
}
