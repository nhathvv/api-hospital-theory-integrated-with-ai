import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CreateAppointmentDto } from './dto';
import { AppointmentStatus, DayOfWeek, DoctorStatus } from '@prisma/client';
import { PaymentStatus } from 'src/payment/enum';
import { TransactionUtil, CodeGeneratorUtils } from '../common/utils';

/**
 * Appointment Service
 * Xử lý logic nghiệp vụ cho chức năng đặt lịch khám bệnh
 */
@Injectable()
export class AppointmentService {
  private readonly logger = new Logger(AppointmentService.name);

  /**
   * Business Rules:
   * - BR-01: Patient chỉ có thể đặt lịch từ 1 giờ sau thời điểm hiện tại
   * - BR-02: Tối đa đặt trước 30 ngày
   * - BR-03: Patient không thể đặt 2 lịch cùng bác sĩ trong cùng ngày
   * - BR-06: Số lượng booking không vượt quá maxPatients của slot
   * - BR-07: Chỉ đặt lịch với bác sĩ có status = ACTIVE
   * - BR-08: Chỉ đặt lịch trong schedule có isActive = true
   */
  private readonly BOOKING_WINDOW_HOURS = 1; // BR-01: Tối thiểu 1 giờ trước
  private readonly MAX_ADVANCE_DAYS = 30; // BR-02: Tối đa đặt trước 30 ngày

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo lịch hẹn mới (FR-008)
   * @param patientId - Mã bệnh nhân (từ JWT token)
   * @param createDto - Dữ liệu tạo lịch hẹn
   * @returns Lịch hẹn mới với trạng thái PENDING
   */
  async create(patientId: string, createDto: CreateAppointmentDto) {
    const { doctorId, timeSlotId, appointmentDate, examinationType, symptoms, notes, paymentMethod } = createDto;

    const { consultationFee } = await this.validateAndGetData(
      patientId,
      doctorId,
      timeSlotId,
      appointmentDate,
    );

    const appointment = await TransactionUtil.executeInTransaction(
      this.prisma,
      async (tx) => {
        const newAppointment = await tx.appointment.create({
          data: {
            patientId,
            doctorId,
            timeSlotId,
            appointmentDate: new Date(appointmentDate),
            examinationType,
            symptoms,
            notes,
            consultationFee,
            status: AppointmentStatus.PENDING,
          },
          include: this.getAppointmentIncludes(),
        });

        const paymentCode = await this.generatePaymentCode(tx);
        await tx.payment.create({
          data: {
            appointmentId: newAppointment.id,
            paymentCode,
            status: PaymentStatus.PENDING,
            method: paymentMethod,
          },
        });

        return newAppointment;
      },
    );

    this.logger.log(
      `Appointment created: ${appointment.id} for patient ${patientId} with doctor ${doctorId}`,
    );

    return this.formatAppointmentResponse(appointment);
  }

  /**
   * Validate dữ liệu và business rules
   */
  private async validateAndGetData(
    patientId: string,
    doctorId: string,
    timeSlotId: string,
    appointmentDate: string,
  ) {
    // 1. Validate ngày đặt lịch (BR-01, BR-02)
    this.validateAppointmentDate(appointmentDate);

    // 2. Validate và lấy thông tin bác sĩ (BR-07)
    const doctor = await this.validateDoctor(doctorId);

    // 3. Validate và lấy thông tin time slot (BR-08)
    const timeSlot = await this.validateTimeSlot(timeSlotId, doctorId, appointmentDate);

    // 4. Kiểm tra slot còn chỗ trống (BR-06)
    await this.validateSlotAvailability(timeSlotId, appointmentDate);

    // 5. Kiểm tra trùng lịch của bệnh nhân (BR-03)
    await this.validateNoDuplicateAppointment(patientId, doctorId, appointmentDate);

    return {
      doctor,
      timeSlot,
      consultationFee: doctor.consultationFee,
    };
  }

  /**
   * BR-01: Patient chỉ có thể đặt lịch từ 1 giờ sau thời điểm hiện tại
   * BR-02: Tối đa đặt trước 30 ngày
   */
  private validateAppointmentDate(appointmentDate: string): void {
    const now = new Date();
    const targetDate = new Date(appointmentDate);
    const minDate = new Date(now.getTime() + this.BOOKING_WINDOW_HOURS * 60 * 60 * 1000);
    const maxDate = new Date(now.getTime() + this.MAX_ADVANCE_DAYS * 24 * 60 * 60 * 1000);

    // Reset time to start of day for date comparison
    targetDate.setHours(0, 0, 0, 0);
    minDate.setHours(0, 0, 0, 0);
    maxDate.setHours(23, 59, 59, 999);

    if (targetDate < minDate) {
      throw new BadRequestException(
        `Ngày đặt lịch không hợp lệ. Vui lòng đặt lịch từ ${this.BOOKING_WINDOW_HOURS} giờ sau thời điểm hiện tại`,
      );
    }

    if (targetDate > maxDate) {
      throw new BadRequestException(
        `Ngày đặt lịch không hợp lệ. Chỉ được đặt trước tối đa ${this.MAX_ADVANCE_DAYS} ngày`,
      );
    }
  }

  /**
   * BR-07: Chỉ đặt lịch với bác sĩ có status = ACTIVE
   */
  private async validateDoctor(doctorId: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId, deletedAt: null },
      include: {
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
    });

    if (!doctor) {
      throw new NotFoundException('Không tìm thấy bác sĩ');
    }

    if (doctor.status !== DoctorStatus.ACTIVE) {
      throw new BadRequestException('Bác sĩ hiện tại không hoạt động. Vui lòng chọn bác sĩ khác');
    }

    return doctor;
  }

  /**
   * BR-08: Chỉ đặt lịch trong schedule có isActive = true
   * Validate time slot thuộc về đúng bác sĩ và ngày hợp lệ
   */
  private async validateTimeSlot(
    timeSlotId: string,
    doctorId: string,
    appointmentDate: string,
  ) {
    const timeSlot = await this.prisma.doctorTimeSlot.findUnique({
      where: { id: timeSlotId },
      include: {
        schedule: {
          select: {
            id: true,
            doctorId: true,
            startDate: true,
            endDate: true,
            isActive: true,
          },
        },
      },
    });

    if (!timeSlot) {
      throw new NotFoundException('Không tìm thấy khung giờ khám');
    }
    // Kiểm tra time slot thuộc đúng bác sĩ
    if (timeSlot.schedule.doctorId !== doctorId) {
      throw new BadRequestException('Khung giờ không thuộc bác sĩ được chọn');
    }
    // BR-08: Kiểm tra schedule đang active
    if (!timeSlot.schedule.isActive) {
      throw new BadRequestException('Lịch làm việc không còn hoạt động. Vui lòng chọn khung giờ khác');
    }
    // Kiểm tra ngày đặt lịch nằm trong khoảng startDate - endDate của schedule
    const targetDate = new Date(appointmentDate);
    const scheduleStartDate = new Date(timeSlot.schedule.startDate);
    const scheduleEndDate = new Date(timeSlot.schedule.endDate);
    // Reset time for date comparison
    targetDate.setHours(0, 0, 0, 0);
    scheduleStartDate.setHours(0, 0, 0, 0);
    scheduleEndDate.setHours(23, 59, 59, 999);
    if (targetDate < scheduleStartDate || targetDate > scheduleEndDate) {
      throw new BadRequestException(
        'Ngày đặt lịch không nằm trong khoảng thời gian làm việc của bác sĩ',
      );
    }

    // Kiểm tra dayOfWeek của time slot khớp với ngày đặt lịch
    const dayOfWeek = this.getDayOfWeek(targetDate);
    if (timeSlot.dayOfWeek !== dayOfWeek) {
      throw new BadRequestException(
        `Khung giờ này không có vào ngày ${this.getDayOfWeekVietnamese(dayOfWeek)}. ` +
        `Khung giờ này chỉ có vào ngày ${this.getDayOfWeekVietnamese(timeSlot.dayOfWeek)}`,
      );
    }

    return timeSlot;
  }

  /**
   * BR-06: Số lượng booking không vượt quá maxPatients của slot
   */
  private async validateSlotAvailability(
    timeSlotId: string,
    appointmentDate: string,
  ): Promise<void> {
    const timeSlot = await this.prisma.doctorTimeSlot.findUnique({
      where: { id: timeSlotId },
      select: { maxPatients: true },
    });

    if (!timeSlot) {
      throw new NotFoundException('Không tìm thấy khung giờ khám');
    }

    // Đếm số lượng lịch hẹn đã đặt cho slot này trong ngày
    const bookedCount = await this.prisma.appointment.count({
      where: {
        timeSlotId,
        appointmentDate: new Date(appointmentDate),
        status: {
          in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.IN_PROGRESS],
        },
      },
    });

    if (bookedCount >= timeSlot.maxPatients) {
      throw new ConflictException('Khung giờ này đã hết chỗ. Vui lòng chọn khung giờ khác');
    }
  }

  /**
   * BR-03: Patient không thể đặt 2 lịch cùng bác sĩ trong cùng ngày
   */
  private async validateNoDuplicateAppointment(
    patientId: string,
    doctorId: string,
    appointmentDate: string,
  ): Promise<void> {
    const existingAppointment = await this.prisma.appointment.findFirst({
      where: {
        patientId,
        doctorId,
        appointmentDate: new Date(appointmentDate),
        status: {
          in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.IN_PROGRESS],
        },
      },
    });

    if (existingAppointment) {
      throw new ConflictException(
        'Bạn đã có lịch hẹn với bác sĩ này trong ngày. Không thể đặt thêm lịch hẹn',
      );
    }
  }

  /**
   * Lấy thông tin include cho appointment query
   */
  private getAppointmentIncludes() {
    return {
      doctor: {
        select: {
          id: true,
          consultationFee: true,
          user: {
            select: {
              fullName: true,
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
      patient: {
        select: {
          id: true,
          user: {
            select: {
              fullName: true,
              email: true,
              phone: true,
            },
          },
        },
      },
      timeSlot: {
        select: {
          id: true,
          startTime: true,
          endTime: true,
          examinationType: true,
        },
      },
    };
  }

  /**
   * Format response theo schema trong SRS
   */
  private formatAppointmentResponse(appointment: any) {
    return {
      id: appointment.id,
      appointmentDate: appointment.appointmentDate.toISOString().split('T')[0],
      status: appointment.status,
      examinationType: appointment.examinationType,
      symptoms: appointment.symptoms,
      notes: appointment.notes,
      consultationFee: appointment.consultationFee,
      doctor: {
        id: appointment.doctor.id,
        name: appointment.doctor.user.fullName,
        specialty: appointment.doctor.primarySpecialty.name,
      },
      timeSlot: {
        id: appointment.timeSlot.id,
        startTime: appointment.timeSlot.startTime,
        endTime: appointment.timeSlot.endTime,
      },
      createdAt: appointment.createdAt.toISOString(),
    };
  }

  /**
   * Chuyển đổi Date sang DayOfWeek enum
   */
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

  /**
   * Chuyển đổi DayOfWeek sang tiếng Việt
   */
  private getDayOfWeekVietnamese(dayOfWeek: DayOfWeek): string {
    const dayMap: Record<DayOfWeek, string> = {
      [DayOfWeek.MONDAY]: 'Thứ Hai',
      [DayOfWeek.TUESDAY]: 'Thứ Ba',
      [DayOfWeek.WEDNESDAY]: 'Thứ Tư',
      [DayOfWeek.THURSDAY]: 'Thứ Năm',
      [DayOfWeek.FRIDAY]: 'Thứ Sáu',
      [DayOfWeek.SATURDAY]: 'Thứ Bảy',
      [DayOfWeek.SUNDAY]: 'Chủ Nhật',
    };
    return dayMap[dayOfWeek];
  }

  private async generatePaymentCode(tx: Parameters<Parameters<typeof TransactionUtil.executeInTransaction>[1]>[0]): Promise<string> {
    const todayPrefix = CodeGeneratorUtils.getTodayPrefix();
    const lastPayment = await tx.payment.findFirst({
      where: { paymentCode: { startsWith: todayPrefix } },
      orderBy: { paymentCode: 'desc' },
      select: { paymentCode: true },
    });
    let sequence = 1;
    if (lastPayment?.paymentCode) {
      const lastSequence = parseInt(lastPayment.paymentCode.slice(-3), 10);
      sequence = lastSequence + 1;
    }
    return CodeGeneratorUtils.generatePaymentCode(sequence);
  }
}
