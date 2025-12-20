import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import {
  CreateAppointmentDto,
  QueryAppointmentDto,
  CancelAppointmentDto,
} from './dto';
import {
  AppointmentStatus,
  DayOfWeek,
  DoctorStatus,
  CancellationReason,
} from '@prisma/client';
import { PaymentStatus } from 'src/payment/enum';
import { TransactionUtils, CodeGeneratorUtils } from '../common/utils';

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
    const {
      doctorId,
      timeSlotId,
      appointmentDate,
      examinationType,
      symptoms,
      notes,
      paymentMethod,
    } = createDto;

    const { consultationFee } = await this.validateAndGetData(
      patientId,
      doctorId,
      timeSlotId,
      appointmentDate,
    );

    const result = await TransactionUtils.executeInTransaction(
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
        const payment = await tx.payment.create({
          data: {
            appointmentId: newAppointment.id,
            paymentCode,
            status: PaymentStatus.PENDING,
            method: paymentMethod,
          },
        });

        return { appointment: newAppointment, payment };
      },
    );

    const { appointment, payment } = result;

    this.logger.log(
      `Appointment created: ${appointment.id} with Payment: ${payment.paymentCode} for patient ${patientId} with doctor ${doctorId}`,
    );

    return this.formatAppointmentResponse(appointment, payment);
  }

  async findAll(query: QueryAppointmentDto) {
    const { startDate, endDate, doctorId, status, patientSearch } = query;

    const where: any = {};

    if (patientSearch) {
      where.patient = {
        user: {
          OR: [
            { fullName: { contains: patientSearch, mode: 'insensitive' } },
            { phone: { contains: patientSearch, mode: 'insensitive' } },
            { email: { contains: patientSearch, mode: 'insensitive' } },
          ],
        },
      };
    }

    if (startDate || endDate) {
      where.appointmentDate = {};
      if (startDate) {
        where.appointmentDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.appointmentDate.lte = new Date(endDate);
      }
    }

    if (doctorId) {
      where.doctorId = doctorId;
    }

    if (status) {
      where.status = status;
    }

    const [appointments, totalItems] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        include: {
          ...this.getAppointmentIncludes(),
          payment: {
            select: {
              id: true,
              paymentCode: true,
              method: true,
              status: true,
            },
          },
        },
        orderBy: query.getPrismaSortParams(),
        ...query.getPrismaParams(),
      }),
      this.prisma.appointment.count({ where }),
    ]);

    const data = appointments.map((appointment) =>
      this.formatAppointmentResponse(appointment, appointment.payment),
    );

    return { data, totalItems };
  }

  async findById(appointmentId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        ...this.getAppointmentIncludes(),
        payment: {
          select: {
            id: true,
            paymentCode: true,
            method: true,
            status: true,
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Không tìm thấy lịch hẹn');
    }

    return this.formatAppointmentResponse(appointment, appointment.payment);
  }

  async cancel(
    appointmentId: string,
    userId: string,
    cancelDto: CancelAppointmentDto,
  ) {
    const { reason, note } = cancelDto;

    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: {
          select: {
            id: true,
            userId: true,
          },
        },
        doctor: {
          select: {
            id: true,
            userId: true,
          },
        },
        payment: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Không tìm thấy lịch hẹn');
    }

    if (
      appointment.patient.userId !== userId &&
      appointment.doctor.userId !== userId
    ) {
      throw new ForbiddenException('Bạn không có quyền hủy lịch hẹn này');
    }

    const cancellableStatuses: AppointmentStatus[] = [
      AppointmentStatus.PENDING,
      AppointmentStatus.CONFIRMED,
    ];
    if (!cancellableStatuses.includes(appointment.status)) {
      throw new BadRequestException(
        `Không thể hủy lịch hẹn với trạng thái ${this.getStatusVietnamese(appointment.status)}`,
      );
    }

    const result = await TransactionUtils.executeInTransaction(
      this.prisma,
      async (tx) => {
        const updatedAppointment = await tx.appointment.update({
          where: { id: appointmentId },
          data: {
            status: AppointmentStatus.CANCELLED,
            cancelledAt: new Date(),
            cancelledById: userId,
            cancellationReason: reason,
            cancellationNote: note,
          },
          include: {
            ...this.getAppointmentIncludes(),
            payment: {
              select: {
                id: true,
                paymentCode: true,
                method: true,
                status: true,
              },
            },
          },
        });

        if (
          appointment.payment &&
          appointment.payment.status === PaymentStatus.PENDING
        ) {
          await tx.payment.update({
            where: { id: appointment.payment.id },
            data: { status: PaymentStatus.FAILED },
          });
        }

        return updatedAppointment;
      },
    );

    this.logger.log(
      `Appointment cancelled: ${appointmentId} by user ${userId}, reason: ${reason}`,
    );

    return this.formatCancelledAppointmentResponse(result, result.payment);
  }

  async updateStatus(appointmentId: string, newStatus: AppointmentStatus) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { payment: true },
    });

    if (!appointment) {
      throw new NotFoundException('Không tìm thấy lịch hẹn');
    }

    const validTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
      [AppointmentStatus.PENDING]: [
        AppointmentStatus.CONFIRMED,
        AppointmentStatus.CANCELLED,
      ],
      [AppointmentStatus.CONFIRMED]: [
        AppointmentStatus.IN_PROGRESS,
        AppointmentStatus.CANCELLED,
        AppointmentStatus.NO_SHOW,
      ],
      [AppointmentStatus.IN_PROGRESS]: [AppointmentStatus.COMPLETED],
      [AppointmentStatus.COMPLETED]: [],
      [AppointmentStatus.CANCELLED]: [],
      [AppointmentStatus.NO_SHOW]: [],
    };

    if (!validTransitions[appointment.status].includes(newStatus)) {
      throw new BadRequestException(
        `Không thể chuyển từ trạng thái ${this.getStatusVietnamese(appointment.status)} sang ${this.getStatusVietnamese(newStatus)}`,
      );
    }

    const updateData: any = { status: newStatus };
    if (newStatus === AppointmentStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }

    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
      include: {
        ...this.getAppointmentIncludes(),
        payment: {
          select: {
            id: true,
            paymentCode: true,
            method: true,
            status: true,
          },
        },
      },
    });

    this.logger.log(
      `Appointment status updated: ${appointmentId} from ${appointment.status} to ${newStatus}`,
    );

    return this.formatAppointmentResponse(updated, updated.payment);
  }

  async cancelByPatient(
    appointmentId: string,
    patientId: string,
    cancelDto: CancelAppointmentDto,
  ) {
    const { reason, note } = cancelDto;

    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: {
          select: {
            id: true,
            userId: true,
          },
        },
        payment: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Không tìm thấy lịch hẹn');
    }

    if (appointment.patient.id !== patientId) {
      throw new ForbiddenException('Bạn không có quyền hủy lịch hẹn này');
    }

    if (appointment.status !== AppointmentStatus.PENDING) {
      throw new BadRequestException(
        'Chỉ có thể hủy lịch hẹn đang chờ xác nhận (PENDING). Vui lòng liên hệ hotline để được hỗ trợ.',
      );
    }

    const result = await TransactionUtils.executeInTransaction(
      this.prisma,
      async (tx) => {
        const updatedAppointment = await tx.appointment.update({
          where: { id: appointmentId },
          data: {
            status: AppointmentStatus.CANCELLED,
            cancelledAt: new Date(),
            cancelledById: appointment.patient.userId,
            cancellationReason: reason,
            cancellationNote: note,
          },
          include: {
            ...this.getAppointmentIncludes(),
            payment: {
              select: {
                id: true,
                paymentCode: true,
                method: true,
                status: true,
              },
            },
          },
        });

        if (
          appointment.payment &&
          appointment.payment.status === PaymentStatus.PENDING
        ) {
          await tx.payment.update({
            where: { id: appointment.payment.id },
            data: { status: PaymentStatus.FAILED },
          });
        }

        return updatedAppointment;
      },
    );

    this.logger.log(
      `Appointment cancelled by patient: ${appointmentId}, reason: ${reason}`,
    );

    return this.formatCancelledAppointmentResponse(result, result.payment);
  }

  async cancelByAdmin(
    appointmentId: string,
    adminUserId: string,
    cancelDto: CancelAppointmentDto,
  ) {
    const { reason, note } = cancelDto;

    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        payment: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Không tìm thấy lịch hẹn');
    }

    const cancellableStatuses: AppointmentStatus[] = [
      AppointmentStatus.PENDING,
      AppointmentStatus.CONFIRMED,
    ];
    if (!cancellableStatuses.includes(appointment.status)) {
      throw new BadRequestException(
        `Không thể hủy lịch hẹn với trạng thái ${this.getStatusVietnamese(appointment.status)}`,
      );
    }

    const result = await TransactionUtils.executeInTransaction(
      this.prisma,
      async (tx) => {
        const updatedAppointment = await tx.appointment.update({
          where: { id: appointmentId },
          data: {
            status: AppointmentStatus.CANCELLED,
            cancelledAt: new Date(),
            cancelledById: adminUserId,
            cancellationReason: reason,
            cancellationNote: note,
          },
          include: {
            ...this.getAppointmentIncludes(),
            payment: {
              select: {
                id: true,
                paymentCode: true,
                method: true,
                status: true,
              },
            },
          },
        });

        if (
          appointment.payment &&
          appointment.payment.status === PaymentStatus.PENDING
        ) {
          await tx.payment.update({
            where: { id: appointment.payment.id },
            data: { status: PaymentStatus.FAILED },
          });
        }

        return updatedAppointment;
      },
    );

    this.logger.log(
      `Appointment cancelled by admin: ${appointmentId}, reason: ${reason}`,
    );

    return this.formatCancelledAppointmentResponse(result, result.payment);
  }

  private getStatusVietnamese(status: AppointmentStatus): string {
    const statusMap: Record<AppointmentStatus, string> = {
      [AppointmentStatus.PENDING]: 'Chờ xác nhận',
      [AppointmentStatus.CONFIRMED]: 'Đã xác nhận',
      [AppointmentStatus.IN_PROGRESS]: 'Đang khám',
      [AppointmentStatus.COMPLETED]: 'Hoàn thành',
      [AppointmentStatus.CANCELLED]: 'Đã hủy',
      [AppointmentStatus.NO_SHOW]: 'Không đến khám',
    };
    return statusMap[status];
  }

  private formatCancelledAppointmentResponse(appointment: any, payment?: any) {
    const response = this.formatAppointmentResponse(appointment, payment);
    return {
      ...response,
      cancelledAt: appointment.cancelledAt?.toISOString(),
      cancellationReason: appointment.cancellationReason,
      cancellationNote: appointment.cancellationNote,
    };
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
    // 0. Validate bệnh nhân tồn tại
    await this.validatePatient(patientId);

    // 1. Validate ngày đặt lịch (BR-01, BR-02)
    this.validateAppointmentDate(appointmentDate);

    // 2. Validate và lấy thông tin bác sĩ (BR-07)
    const doctor = await this.validateDoctor(doctorId);

    // 3. Validate và lấy thông tin time slot (BR-08)
    const timeSlot = await this.validateTimeSlot(
      timeSlotId,
      doctorId,
      appointmentDate,
    );

    // 4. Kiểm tra slot còn chỗ trống (BR-06)
    await this.validateSlotAvailability(timeSlotId, appointmentDate);

    // 5. Kiểm tra trùng lịch của bệnh nhân (BR-03)
    await this.validateNoDuplicateAppointment(
      patientId,
      doctorId,
      appointmentDate,
    );

    return {
      doctor,
      timeSlot,
      consultationFee: doctor.consultationFee,
    };
  }

  private async validatePatient(patientId: string): Promise<void> {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId, deletedAt: null },
      select: { id: true },
    });

    if (!patient) {
      throw new NotFoundException('Không tìm thấy thông tin bệnh nhân');
    }
  }

  /**
   * BR-01: Patient chỉ có thể đặt lịch từ 1 giờ sau thời điểm hiện tại
   * BR-02: Tối đa đặt trước 30 ngày
   */
  private validateAppointmentDate(appointmentDate: string): void {
    const now = new Date();
    const targetDate = new Date(appointmentDate);
    const minDate = new Date(
      now.getTime() + this.BOOKING_WINDOW_HOURS * 60 * 60 * 1000,
    );
    const maxDate = new Date(
      now.getTime() + this.MAX_ADVANCE_DAYS * 24 * 60 * 60 * 1000,
    );

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
      throw new BadRequestException(
        'Bác sĩ hiện tại không hoạt động. Vui lòng chọn bác sĩ khác',
      );
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
      throw new BadRequestException(
        'Lịch làm việc không còn hoạt động. Vui lòng chọn khung giờ khác',
      );
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
          in: [
            AppointmentStatus.PENDING,
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.IN_PROGRESS,
          ],
        },
      },
    });

    if (bookedCount >= timeSlot.maxPatients) {
      throw new ConflictException(
        'Khung giờ này đã hết chỗ. Vui lòng chọn khung giờ khác',
      );
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
          in: [
            AppointmentStatus.PENDING,
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.IN_PROGRESS,
          ],
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
          yearsOfExperience: true,
          professionalTitle: true,
          bio: true,
          user: {
            select: {
              fullName: true,
              email: true,
              phone: true,
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
          dayOfWeek: true,
          examinationType: true,
        },
      },
    };
  }

  private formatAppointmentResponse(appointment: any, payment?: any) {
    const response: any = {
      id: appointment.id,
      appointmentDate: appointment.appointmentDate.toISOString().split('T')[0],
      status: appointment.status,
      examinationType: appointment.examinationType,
      symptoms: appointment.symptoms,
      notes: appointment.notes,
      consultationFee: appointment.consultationFee,
      patient: {
        id: appointment.patient.id,
        name: appointment.patient.user.fullName,
        email: appointment.patient.user.email,
        phone: appointment.patient.user.phone,
      },
      doctor: {
        id: appointment.doctor.id,
        name: appointment.doctor.user.fullName,
        email: appointment.doctor.user.email,
        phone: appointment.doctor.user.phone,
        avatar: appointment.doctor.user.avatar,
        professionalTitle: appointment.doctor.professionalTitle,
        yearsOfExperience: appointment.doctor.yearsOfExperience,
        bio: appointment.doctor.bio,
        specialty: {
          id: appointment.doctor.primarySpecialty.id,
          name: appointment.doctor.primarySpecialty.name,
        },
      },
      timeSlot: {
        id: appointment.timeSlot.id,
        date: appointment.appointmentDate.toISOString().split('T')[0],
        dayOfWeek: appointment.timeSlot.dayOfWeek,
        startTime: appointment.timeSlot.startTime,
        endTime: appointment.timeSlot.endTime,
      },
      createdAt: appointment.createdAt.toISOString(),
    };

    if (payment) {
      response.payment = {
        id: payment.id,
        paymentCode: payment.paymentCode,
        method: payment.method,
        status: payment.status,
      };
    }

    return response;
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

  private async generatePaymentCode(
    tx: Parameters<
      Parameters<typeof TransactionUtils.executeInTransaction>[1]
    >[0],
  ): Promise<string> {
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
