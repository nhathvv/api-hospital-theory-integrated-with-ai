import { Controller, Post, Body, UseGuards, ForbiddenException } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as ApiResponseSwagger,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles, CurrentUser } from '../auth/decorators';
import { UserRole } from '../common/constants';
import { ApiResponse } from '../common/dto';

/**
 * Appointment Controller
 * Xử lý các API liên quan đến đặt lịch khám bệnh cho Patient
 */
@ApiTags('Appointments')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PATIENT)
@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  /**
   * FR-008: Create Appointment (Draft)
   * Tạo lịch hẹn mới với trạng thái PENDING
   */
  @Post()
  @ApiOperation({
    summary: 'Tạo lịch hẹn khám bệnh mới',
    description: `
      Tạo lịch hẹn khám bệnh mới với trạng thái PENDING.
      
      **Business Rules:**
      - BR-01: Chỉ có thể đặt lịch từ 1 giờ sau thời điểm hiện tại
      - BR-02: Tối đa đặt trước 30 ngày
      - BR-03: Không thể đặt 2 lịch cùng bác sĩ trong cùng ngày
      - BR-06: Số lượng booking không vượt quá maxPatients của slot
      - BR-07: Chỉ đặt lịch với bác sĩ có status = ACTIVE
      - BR-08: Chỉ đặt lịch trong schedule có isActive = true
    `,
  })
  @ApiResponseSwagger({
    status: 201,
    description: 'Tạo lịch hẹn thành công',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        message: 'Tạo lịch hẹn thành công',
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          appointmentDate: '2024-12-16',
          status: 'PENDING',
          examinationType: 'IN_PERSON',
          symptoms: 'Đau bụng, buồn nôn 2 ngày',
          notes: 'Có tiền sử dị ứng Penicillin',
          consultationFee: 200000,
          doctor: {
            id: '550e8400-e29b-41d4-a716-446655440001',
            name: 'BS. Nguyễn Văn A',
            specialty: 'Nội khoa',
          },
          timeSlot: {
            id: '550e8400-e29b-41d4-a716-446655440002',
            startTime: '08:00',
            endTime: '08:30',
          },
          payment: {
            id: '550e8400-e29b-41d4-a716-446655440003',
            paymentCode: '20241218001',
            method: 'BANK_TRANSFER',
            status: 'PENDING',
          },
          createdAt: '2024-12-13T10:00:00.000Z',
        },
        timestamp: '2024-12-13T10:00:00.000Z',
      },
    },
  })
  @ApiResponseSwagger({
    status: 400,
    description: 'Dữ liệu không hợp lệ hoặc vi phạm business rules',
  })
  @ApiResponseSwagger({
    status: 404,
    description: 'Không tìm thấy bác sĩ hoặc khung giờ',
  })
  @ApiResponseSwagger({
    status: 409,
    description: 'Khung giờ đã hết chỗ hoặc đã có lịch hẹn trùng',
  })
  async create(
    @CurrentUser('patientId') patientId: string,
    @Body() createAppointmentDto: CreateAppointmentDto,
  ) {
    if (!patientId) {
      throw new ForbiddenException('Không tìm thấy thông tin bệnh nhân. Vui lòng cập nhật hồ sơ');
    }
    const appointment = await this.appointmentService.create(
      patientId,
      createAppointmentDto,
    );
    return ApiResponse.success(appointment, 'Tạo lịch hẹn thành công', 201);
  }
}
