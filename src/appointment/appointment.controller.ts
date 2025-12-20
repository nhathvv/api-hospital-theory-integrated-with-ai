import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as ApiResponseSwagger,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AppointmentService } from './appointment.service';
import {
  CreateAppointmentDto,
  QueryAppointmentDto,
  CancelAppointmentDto,
} from './dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles, CurrentUser } from '../auth/decorators';
import { UserRole } from '../common/constants';
import { ApiResponse, PaginatedResponse } from '../common/dto';

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
      Lấy danh sách lịch hẹn với các bộ lọc:
      - **patientSearch**: Tìm kiếm theo tên, số điện thoại hoặc email bệnh nhân
      - **startDate**: Lọc từ ngày (YYYY-MM-DD)
      - **endDate**: Lọc đến ngày (YYYY-MM-DD)
      - **doctorId**: Lọc theo bác sĩ
      - **status**: Lọc theo trạng thái (PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW)
    `,
  })
  @ApiResponseSwagger({
    status: 200,
    description: 'Lấy danh sách lịch hẹn thành công',
  })
  async findAll(@Query() query: QueryAppointmentDto) {
    const { data, totalItems } = await this.appointmentService.findAll(query);
    return PaginatedResponse.create(
      data,
      totalItems,
      query,
      'Lấy danh sách lịch hẹn thành công',
    );
  }

  @Post()
  @ApiOperation({
    summary: 'Tạo lịch hẹn mới',
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
      throw new ForbiddenException(
        'Không tìm thấy thông tin bệnh nhân. Vui lòng cập nhật hồ sơ.',
      );
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
    summary: 'Lấy chi tiết lịch hẹn',
    description: 'Lấy thông tin chi tiết của một lịch hẹn theo ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ID lịch hẹn',
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

  @Post(':id/cancel')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT)
  @ApiOperation({
    summary: 'Hủy lịch hẹn',
    description: `
      Hủy lịch hẹn với lý do và ghi chú.
      
      **Business Rules:**
      - Chỉ có thể hủy lịch hẹn với trạng thái PENDING hoặc CONFIRMED
      - Bệnh nhân chỉ có thể hủy lịch hẹn của chính mình
      - Bác sĩ có thể hủy lịch hẹn được gán cho họ
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
    description: 'ID lịch hẹn cần hủy',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponseSwagger({
    status: 200,
    description: 'Hủy lịch hẹn thành công',
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
    const appointment = await this.appointmentService.cancel(
      id,
      userId,
      cancelDto,
    );
    return ApiResponse.success(appointment, 'Hủy lịch hẹn thành công');
  }
}
