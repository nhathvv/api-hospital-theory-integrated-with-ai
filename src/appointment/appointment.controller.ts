import { Controller, Post, Get, Patch, Body, Query, Param, UseGuards, ForbiddenException } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as ApiResponseSwagger,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto, QueryAppointmentDto, CancelAppointmentDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles, CurrentUser } from '../auth/decorators';
import { UserRole } from '../common/constants';
import { ApiResponse, PaginatedResponse } from '../common/dto';

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

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT)
  @ApiOperation({
    summary: 'Lấy danh sách lịch hẹn',
    description: `
      Lấy danh sách lịch hẹn với các filter:
      - **patientSearch**: Tìm kiếm theo tên, số điện thoại hoặc email của bệnh nhân
      - **startDate**: Lọc từ ngày (YYYY-MM-DD)
      - **endDate**: Lọc đến ngày (YYYY-MM-DD)
      - **doctorId**: Lọc theo bác sĩ
      - **status**: Lọc theo trạng thái (PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW)
    `,
  })
  @ApiResponseSwagger({
    status: 200,
    description: 'Lấy danh sách lịch hẹn thành công',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        message: 'Lấy danh sách lịch hẹn thành công',
        data: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            appointmentDate: '2024-12-16',
            status: 'PENDING',
            examinationType: 'IN_PERSON',
            symptoms: 'Đau bụng, buồn nôn',
            consultationFee: 200000,
            doctor: {
              id: '550e8400-e29b-41d4-a716-446655440001',
              name: 'BS. Nguyễn Văn A',
            },
            patient: {
              id: '550e8400-e29b-41d4-a716-446655440002',
              name: 'Nguyễn Văn B',
              email: 'patient@example.com',
              phone: '0901234567',
            },
            timeSlot: {
              id: '550e8400-e29b-41d4-a716-446655440003',
              startTime: '08:00',
              endTime: '08:30',
            },
            payment: {
              id: '550e8400-e29b-41d4-a716-446655440004',
              paymentCode: '20241218001',
              status: 'PENDING',
            },
            createdAt: '2024-12-13T10:00:00.000Z',
          },
        ],
        meta: {
          page: 1,
          limit: 10,
          totalItems: 50,
          totalPages: 5,
          hasNextPage: true,
          hasPreviousPage: false,
        },
        timestamp: '2024-12-13T10:00:00.000Z',
      },
    },
  })
  async findAll(@Query() query: QueryAppointmentDto) {
    const { data, totalItems } = await this.appointmentService.findAll(query);
    return PaginatedResponse.create(data, totalItems, query, 'Lấy danh sách lịch hẹn thành công');
  }

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
            email: 'doctor@example.com',
            phone: '0901234567',
            avatar: 'https://example.com/avatar.jpg',
            professionalTitle: 'Thạc sĩ, Bác sĩ',
            yearsOfExperience: 10,
            bio: 'Chuyên gia về nội khoa với 10 năm kinh nghiệm',
            specialty: {
              id: '550e8400-e29b-41d4-a716-446655440004',
              name: 'Nội khoa',
            },
          },
          timeSlot: {
            id: '550e8400-e29b-41d4-a716-446655440002',
            date: '2024-12-16',
            dayOfWeek: 'MONDAY',
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

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT)
  @ApiOperation({
    summary: 'Lấy thông tin chi tiết lịch hẹn',
    description: 'Lấy thông tin chi tiết của một lịch hẹn theo ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của lịch hẹn',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponseSwagger({
    status: 200,
    description: 'Lấy thông tin lịch hẹn thành công',
  })
  @ApiResponseSwagger({
    status: 404,
    description: 'Không tìm thấy lịch hẹn',
  })
  async findById(@Param('id') id: string) {
    const appointment = await this.appointmentService.findById(id);
    return ApiResponse.success(appointment, 'Lấy thông tin lịch hẹn thành công');
  }

  @Patch(':id/cancel')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT)
  @ApiOperation({
    summary: 'Hủy lịch hẹn',
    description: `
      Hủy lịch hẹn với lý do và ghi chú.
      
      **Business Rules:**
      - Chỉ có thể hủy lịch hẹn với trạng thái PENDING hoặc CONFIRMED
      - Patient chỉ có thể hủy lịch hẹn của chính mình
      - Doctor có thể hủy lịch hẹn mà họ được đặt
      - Admin có thể hủy mọi lịch hẹn
      
      **Lý do hủy:**
      - PATIENT_REQUEST: Bệnh nhân yêu cầu hủy
      - DOCTOR_UNAVAILABLE: Bác sĩ không có mặt
      - EMERGENCY: Trường hợp khẩn cấp
      - SCHEDULE_CONFLICT: Xung đột lịch trình
      - OTHER: Lý do khác
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'ID của lịch hẹn cần hủy',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponseSwagger({
    status: 200,
    description: 'Hủy lịch hẹn thành công',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        message: 'Hủy lịch hẹn thành công',
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          appointmentDate: '2024-12-16',
          status: 'CANCELLED',
          examinationType: 'IN_PERSON',
          symptoms: 'Đau bụng, buồn nôn',
          consultationFee: 200000,
          cancelledAt: '2024-12-15T10:00:00.000Z',
          cancellationReason: 'PATIENT_REQUEST',
          cancellationNote: 'Tôi có việc bận đột xuất',
          doctor: {
            id: '550e8400-e29b-41d4-a716-446655440001',
            name: 'BS. Nguyễn Văn A',
          },
          patient: {
            id: '550e8400-e29b-41d4-a716-446655440002',
            name: 'Nguyễn Văn B',
          },
          payment: {
            id: '550e8400-e29b-41d4-a716-446655440003',
            paymentCode: '20241218001',
            status: 'FAILED',
          },
          createdAt: '2024-12-13T10:00:00.000Z',
        },
        timestamp: '2024-12-15T10:00:00.000Z',
      },
    },
  })
  @ApiResponseSwagger({
    status: 400,
    description: 'Không thể hủy lịch hẹn với trạng thái hiện tại',
  })
  @ApiResponseSwagger({
    status: 403,
    description: 'Không có quyền hủy lịch hẹn này',
  })
  @ApiResponseSwagger({
    status: 404,
    description: 'Không tìm thấy lịch hẹn',
  })
  async cancel(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() cancelDto: CancelAppointmentDto,
  ) {
    const appointment = await this.appointmentService.cancel(id, userId, cancelDto);
    return ApiResponse.success(appointment, 'Hủy lịch hẹn thành công');
  }
}
