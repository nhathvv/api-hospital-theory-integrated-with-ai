import {
  Controller,
  Get,
  Patch,
  Query,
  Param,
  Body,
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
import { DoctorService } from './doctor.service';
import {
  QueryDoctorDto,
  QueryMyPatientsDto,
  UpdateConsultationDto,
} from './dto';
import { ApiResponse, PaginatedResponse } from '../common/dto';
import { DoctorStatus } from '@prisma/client';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles, CurrentUser } from '../auth/decorators';
import { UserRole } from '../common/constants';

@ApiTags('Public - Doctors')
@Controller('doctors')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active doctors for patients' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Doctors retrieved successfully',
  })
  async findAll(@Query() query: QueryDoctorDto) {
    query.status = DoctorStatus.ACTIVE;
    const result = await this.doctorService.findAll(query);
    return PaginatedResponse.create(
      result.data,
      result.total,
      query,
      'Doctors retrieved successfully',
    );
  }

  @Get('my-patients')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  @ApiBearerAuth('JWT-auth')
  @ApiTags('Doctor - My Patients')
  @ApiOperation({
    summary: 'Lấy danh sách bệnh nhân của bác sĩ',
    description: `
      Lấy danh sách tất cả bệnh nhân đã/đang có lịch hẹn với bác sĩ hiện tại.
      
      **Filters:**
      - keyword: Tìm kiếm theo tên, email, số điện thoại bệnh nhân
      - appointmentStatus: Lọc theo trạng thái lịch hẹn (PENDING, CONFIRMED, COMPLETED, CANCELLED, etc.)
    `,
  })
  @ApiResponseSwagger({
    status: 200,
    description: 'Lấy danh sách bệnh nhân thành công',
  })
  @ApiResponseSwagger({
    status: 403,
    description: 'Không có quyền truy cập (không phải bác sĩ)',
  })
  async getMyPatients(
    @CurrentUser('doctorId') doctorId: string,
    @Query() query: QueryMyPatientsDto,
  ) {
    if (!doctorId) {
      throw new ForbiddenException(
        'Không tìm thấy thông tin bác sĩ. Vui lòng liên hệ quản trị viên.',
      );
    }
    const { data, total } = await this.doctorService.getMyPatients(
      doctorId,
      query,
    );
    return PaginatedResponse.create(
      data,
      total,
      query,
      'Lấy danh sách bệnh nhân thành công',
    );
  }

  @Get('my-patients/:patientId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  @ApiBearerAuth('JWT-auth')
  @ApiTags('Doctor - My Patients')
  @ApiOperation({
    summary: 'Xem chi tiết bệnh nhân',
    description: `
      Xem thông tin chi tiết của một bệnh nhân, bao gồm:
      - Thông tin cá nhân
      - Chỉ số sức khỏe (chiều cao, cân nặng, nhóm máu, dị ứng)
      - Lịch sử các lần khám với bác sĩ hiện tại
      - Tài liệu y tế đã upload
      
      **Lưu ý:** Chỉ có thể xem bệnh nhân đã/đang có lịch hẹn với bạn.
    `,
  })
  @ApiParam({
    name: 'patientId',
    description: 'ID của bệnh nhân',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponseSwagger({
    status: 200,
    description: 'Lấy thông tin bệnh nhân thành công',
  })
  @ApiResponseSwagger({
    status: 403,
    description: 'Không có quyền truy cập',
  })
  @ApiResponseSwagger({
    status: 404,
    description:
      'Không tìm thấy bệnh nhân hoặc bệnh nhân không có lịch hẹn với bạn',
  })
  async getPatientDetail(
    @CurrentUser('doctorId') doctorId: string,
    @Param('patientId') patientId: string,
  ) {
    if (!doctorId) {
      throw new ForbiddenException(
        'Không tìm thấy thông tin bác sĩ. Vui lòng liên hệ quản trị viên.',
      );
    }
    const patient = await this.doctorService.getPatientDetail(
      doctorId,
      patientId,
    );
    return ApiResponse.success(patient, 'Lấy thông tin bệnh nhân thành công');
  }

  @Patch('appointments/:appointmentId/consultation')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  @ApiBearerAuth('JWT-auth')
  @ApiTags('Doctor - Consultation')
  @ApiOperation({
    summary: 'Cập nhật chẩn đoán và kê đơn thuốc',
    description: `
      Bác sĩ cập nhật chẩn đoán và kê đơn thuốc cho lịch hẹn.
      
      **Business Rules:**
      - Chỉ có thể cập nhật lịch hẹn có trạng thái CONFIRMED hoặc IN_PROGRESS
      - Chỉ bác sĩ được gán lịch hẹn mới có quyền cập nhật
      - Có thể đánh dấu hoàn thành khám (COMPLETED) khi gửi status
    `,
  })
  @ApiParam({
    name: 'appointmentId',
    description: 'ID của lịch hẹn',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponseSwagger({
    status: 200,
    description: 'Cập nhật chẩn đoán thành công',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        message: 'Cập nhật chẩn đoán thành công',
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          appointmentDate: '2024-12-20',
          status: 'COMPLETED',
          symptoms: 'Đau đầu, sốt nhẹ',
          diagnosis: 'Viêm họng cấp, nhiễm virus đường hô hấp trên',
          prescription:
            'Paracetamol 500mg x 2 viên/ngày\nAmoxicillin 500mg x 3 viên/ngày',
          notes: 'Nghỉ ngơi, uống nhiều nước, tái khám sau 3 ngày',
          completedAt: '2024-12-20T10:30:00.000Z',
          patient: {
            id: '550e8400-e29b-41d4-a716-446655440001',
            user: {
              id: '550e8400-e29b-41d4-a716-446655440002',
              fullName: 'Nguyễn Văn A',
              email: 'patient@example.com',
              phone: '0901234567',
            },
          },
          timeSlot: {
            startTime: '09:00',
            endTime: '09:30',
            dayOfWeek: 'FRIDAY',
          },
        },
        timestamp: '2024-12-20T10:30:00.000Z',
      },
    },
  })
  @ApiResponseSwagger({
    status: 400,
    description: 'Lịch hẹn không hợp lệ hoặc không có quyền cập nhật',
  })
  @ApiResponseSwagger({
    status: 403,
    description: 'Không có quyền truy cập',
  })
  @ApiResponseSwagger({
    status: 404,
    description: 'Không tìm thấy lịch hẹn',
  })
  async updateConsultation(
    @CurrentUser('doctorId') doctorId: string,
    @Param('appointmentId') appointmentId: string,
    @Body() dto: UpdateConsultationDto,
  ) {
    if (!doctorId) {
      throw new ForbiddenException(
        'Không tìm thấy thông tin bác sĩ. Vui lòng liên hệ quản trị viên.',
      );
    }
    const appointment = await this.doctorService.updateConsultation(
      doctorId,
      appointmentId,
      dto,
    );
    return ApiResponse.success(appointment, 'Cập nhật chẩn đoán thành công');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get doctor detail by ID' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Doctor retrieved successfully',
  })
  @ApiResponseSwagger({ status: 404, description: 'Doctor not found' })
  async findOne(@Param('id') id: string) {
    const doctor = await this.doctorService.findOne(id);
    return ApiResponse.success(doctor, 'Doctor retrieved successfully');
  }
}
