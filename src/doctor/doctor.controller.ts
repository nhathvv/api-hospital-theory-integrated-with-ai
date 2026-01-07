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
import { PrescriptionService, UpdatePrescriptionDto } from '../prescription';
import { UploadService } from '../upload/upload.service';

@ApiTags('Doctor')
@Controller('doctors')
export class DoctorController {
  constructor(
    private readonly doctorService: DoctorService,
    private readonly prescriptionService: PrescriptionService,
    private readonly uploadService: UploadService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách bác sĩ đang hoạt động' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Lấy danh sách bác sĩ thành công',
  })
  async findAll(@Query() query: QueryDoctorDto) {
    query.status = DoctorStatus.ACTIVE;
    const result = await this.doctorService.findAll(query);
    return PaginatedResponse.create(
      result.data,
      result.total,
      query,
      'Lấy danh sách bác sĩ thành công',
    );
  }

  @Get('me/patients')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Lấy danh sách bệnh nhân của tôi',
    description: `
      Lấy danh sách tất cả bệnh nhân đã/đang có lịch hẹn với bác sĩ hiện tại.
      
      **Bộ lọc:**
      - keyword: Tìm kiếm theo tên, email, số điện thoại bệnh nhân
      - appointmentStatus: Lọc theo trạng thái lịch hẹn (PENDING, CONFIRMED, COMPLETED, CANCELLED, v.v.)
    `,
  })
  @ApiResponseSwagger({
    status: 200,
    description: 'Lấy danh sách bệnh nhân thành công',
  })
  @ApiResponseSwagger({
    status: 403,
    description: 'Không có quyền truy cập - không phải bác sĩ',
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

  @Get('me/patients/:patientId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  @ApiBearerAuth('JWT-auth')
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
    description: 'ID bệnh nhân',
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
    description: 'Không tìm thấy bệnh nhân hoặc bệnh nhân không có lịch hẹn với bạn',
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

  @Patch('me/appointments/:appointmentId/consultation')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Cập nhật chẩn đoán',
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
    description: 'ID lịch hẹn',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponseSwagger({
    status: 200,
    description: 'Cập nhật chẩn đoán thành công',
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

  @Patch('me/appointments/:appointmentId/prescription')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Kê đơn thuốc cho lịch hẹn',
    description: `
      Bác sĩ kê đơn thuốc từ kho thuốc cho lịch hẹn.
      
      **Business Rules:**
      - Chỉ có thể kê đơn cho lịch hẹn có trạng thái CONFIRMED, IN_PROGRESS hoặc COMPLETED
      - Chỉ bác sĩ được gán lịch hẹn mới có quyền kê đơn
      - Hệ thống tự động:
        + Tính tiền thuốc (medicineFee) từ các item
        + Cập nhật tổng tiền (totalFee = consultationFee + medicineFee)
        + Trừ số lượng tồn kho của các lô thuốc
        + Cập nhật trạng thái lô thuốc nếu cần (LOW_STOCK, OUT_OF_STOCK)
      - Nếu kê đơn lại, đơn cũ sẽ bị xóa và hoàn lại số lượng thuốc vào kho
    `,
  })
  @ApiParam({
    name: 'appointmentId',
    description: 'ID lịch hẹn',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponseSwagger({
    status: 200,
    description: 'Kê đơn thuốc thành công',
  })
  @ApiResponseSwagger({
    status: 400,
    description: 'Lỗi validation hoặc không đủ tồn kho',
  })
  @ApiResponseSwagger({
    status: 403,
    description: 'Không có quyền kê đơn cho lịch hẹn này',
  })
  @ApiResponseSwagger({
    status: 404,
    description: 'Không tìm thấy lịch hẹn hoặc lô thuốc',
  })
  async updatePrescription(
    @CurrentUser('doctorId') doctorId: string,
    @Param('appointmentId') appointmentId: string,
    @Body() dto: UpdatePrescriptionDto,
  ) {
    if (!doctorId) {
      throw new ForbiddenException(
        'Không tìm thấy thông tin bác sĩ. Vui lòng liên hệ quản trị viên.',
      );
    }
    const result = await this.prescriptionService.createPrescription(
      appointmentId,
      doctorId,
      dto,
    );
    return ApiResponse.success(result, 'Kê đơn thuốc thành công');
  }

  @Get('me/appointments/:appointmentId/prescription')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Xem đơn thuốc của lịch hẹn',
    description: 'Lấy danh sách các thuốc đã kê cho lịch hẹn',
  })
  @ApiParam({
    name: 'appointmentId',
    description: 'ID lịch hẹn',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponseSwagger({
    status: 200,
    description: 'Lấy đơn thuốc thành công',
  })
  async getPrescription(@Param('appointmentId') appointmentId: string) {
    const items = await this.prescriptionService.getPrescription(appointmentId);
    return ApiResponse.success(items, 'Lấy đơn thuốc thành công');
  }

  @Get('me/documents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy danh sách tài liệu y tế của tôi' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Lấy danh sách tài liệu thành công',
  })
  @ApiResponseSwagger({
    status: 403,
    description: 'Không có quyền truy cập',
  })
  async getMyDocuments(
    @CurrentUser('sub') userId: string,
    @CurrentUser('doctorId') doctorId: string,
  ) {
    if (!doctorId) {
      throw new ForbiddenException(
        'Không tìm thấy thông tin bác sĩ. Vui lòng liên hệ quản trị viên.',
      );
    }
    const documents = await this.uploadService.getDoctorDocuments(
      doctorId,
      userId,
    );
    return ApiResponse.success(documents, 'Lấy danh sách tài liệu thành công');
  }

  @Get('me/patients/:patientId/documents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy danh sách tài liệu y tế của bệnh nhân' })
  @ApiParam({ name: 'patientId', description: 'ID bệnh nhân' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Lấy danh sách tài liệu thành công',
  })
  @ApiResponseSwagger({
    status: 403,
    description: 'Không có quyền truy cập',
  })
  @ApiResponseSwagger({
    status: 404,
    description: 'Không tìm thấy bệnh nhân',
  })
  async getPatientDocuments(
    @CurrentUser('sub') userId: string,
    @Param('patientId') patientId: string,
  ) {
    const documents = await this.uploadService.getPatientDocuments(
      patientId,
      userId,
    );
    return ApiResponse.success(documents, 'Lấy danh sách tài liệu thành công');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết bác sĩ' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Lấy thông tin bác sĩ thành công',
  })
  @ApiResponseSwagger({ status: 404, description: 'Không tìm thấy bác sĩ' })
  async findOne(@Param('id') id: string) {
    const doctor = await this.doctorService.findOne(id);
    return ApiResponse.success(doctor, 'Lấy thông tin bác sĩ thành công');
  }
}
