import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as ApiResponseSwagger,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { PatientService } from './patient.service';
import { UpdatePatientDto, QueryConsultationHistoryDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles, CurrentUser } from '../auth/decorators';
import { UserRole } from '../common/constants';
import { ApiResponse, PaginatedResponse } from '../common/dto';
import { ExceptionUtils } from '../common/utils';
import { PaymentService, QueryMyPaymentDto } from '../payment';

@ApiTags('Patient')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PATIENT)
@Controller('patients')
export class PatientController {
  constructor(
    private readonly patientService: PatientService,
    private readonly paymentService: PaymentService,
  ) {}

  @Patch('me')
  @ApiOperation({ summary: 'Cập nhật hồ sơ bệnh nhân' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Cập nhật hồ sơ thành công',
  })
  @ApiResponseSwagger({
    status: 400,
    description: 'Dữ liệu không hợp lệ',
  })
  @ApiResponseSwagger({ status: 401, description: 'Chưa xác thực' })
  @ApiResponseSwagger({ status: 404, description: 'Không tìm thấy hồ sơ bệnh nhân' })
  async updateMyProfile(
    @CurrentUser('sub') userId: string,
    @Body() updatePatientDto: UpdatePatientDto,
  ) {
    const patient = await this.patientService.updateMyProfile(
      userId,
      updatePatientDto,
    );
    return ApiResponse.success(patient, 'Cập nhật hồ sơ thành công');
  }

  @Get('me/payments')
  @ApiOperation({ summary: 'Lấy danh sách thanh toán của tôi' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Lấy danh sách thanh toán thành công',
  })
  @ApiResponseSwagger({ status: 401, description: 'Chưa xác thực' })
  async findMyPayments(
    @CurrentUser('sub') userId: string,
    @Query() query: QueryMyPaymentDto,
  ) {
    const patient = await this.patientService.getProfileByUserId(userId);
    if (!patient) {
      ExceptionUtils.throwNotFound('Không tìm thấy hồ sơ bệnh nhân');
    }
    const result = await this.paymentService.findMyPayments(patient.id, query);
    return PaginatedResponse.create(
      result.data,
      result.total,
      query,
      'Lấy danh sách thanh toán thành công',
    );
  }

  @Get('me/payments/:id')
  @ApiOperation({ summary: 'Lấy chi tiết thanh toán' })
  @ApiParam({ name: 'id', description: 'ID thanh toán' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Lấy chi tiết thanh toán thành công',
  })
  @ApiResponseSwagger({ status: 401, description: 'Chưa xác thực' })
  @ApiResponseSwagger({ status: 404, description: 'Không tìm thấy thanh toán' })
  async findMyPaymentById(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ) {
    const patient = await this.patientService.getProfileByUserId(userId);
    if (!patient) {
      ExceptionUtils.throwNotFound('Không tìm thấy hồ sơ bệnh nhân');
    }
    const payment = await this.paymentService.findMyPaymentById(id, patient.id);
    return ApiResponse.success(payment, 'Lấy chi tiết thanh toán thành công');
  }

  @Get('me/consultations')
  @ApiOperation({
    summary: 'Lấy lịch sử khám bệnh',
    description: `
      Lấy lịch sử khám bệnh của bệnh nhân.
      
      **Thông tin trả về bao gồm:**
      - Ngày khám, thời gian khám
      - Thông tin bác sĩ (tên, chuyên khoa)
      - Chẩn đoán
      
      **Bộ lọc:**
      - Theo khoảng thời gian (startDate, endDate)
      - Theo bác sĩ (doctorId)
      - Theo từ khóa chẩn đoán (keyword)
    `,
  })
  @ApiResponseSwagger({
    status: 200,
    description: 'Lấy lịch sử khám bệnh thành công',
  })
  @ApiResponseSwagger({ status: 401, description: 'Chưa xác thực' })
  async findMyConsultationHistory(
    @CurrentUser('sub') userId: string,
    @Query() query: QueryConsultationHistoryDto,
  ) {
    const patient = await this.patientService.getProfileByUserId(userId);
    if (!patient) {
      ExceptionUtils.throwNotFound('Không tìm thấy hồ sơ bệnh nhân');
    }
    const result = await this.patientService.findMyConsultationHistory(
      patient.id,
      query,
    );
    return PaginatedResponse.create(
      result.data,
      result.total,
      query,
      'Lấy lịch sử khám bệnh thành công',
    );
  }

  @Get('me/consultations/:id')
  @ApiOperation({
    summary: 'Lấy chi tiết lần khám',
    description: `
      Lấy chi tiết một lần khám bệnh.
      
      **Thông tin trả về bao gồm:**
      - Thông tin lịch hẹn (ngày, giờ, loại khám)
      - Thông tin bác sĩ (tên, chuyên khoa, liên hệ)
      - Triệu chứng, chẩn đoán
      - Đơn thuốc chi tiết (tên thuốc, liều lượng, hướng dẫn)
      - Tài liệu y tế (nếu có)
      - Thông tin thanh toán
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'ID lịch hẹn',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponseSwagger({
    status: 200,
    description: 'Lấy chi tiết lần khám thành công',
  })
  @ApiResponseSwagger({ status: 401, description: 'Chưa xác thực' })
  @ApiResponseSwagger({ status: 404, description: 'Không tìm thấy lần khám' })
  async findConsultationById(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ) {
    const patient = await this.patientService.getProfileByUserId(userId);
    if (!patient) {
      ExceptionUtils.throwNotFound('Không tìm thấy hồ sơ bệnh nhân');
    }
    const consultation = await this.patientService.findConsultationById(
      patient.id,
      id,
    );
    return ApiResponse.success(consultation, 'Lấy chi tiết lần khám thành công');
  }
}
