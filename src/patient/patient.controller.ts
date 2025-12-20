import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
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
import { PatientService } from './patient.service';
import { UpdatePatientDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles, CurrentUser } from '../auth/decorators';
import { UserRole } from '../common/constants';
import { ApiResponse, PaginatedResponse } from '../common/dto';
import { ExceptionUtils } from '../common/utils';
import { PaymentService, QueryMyPaymentDto } from '../payment';
import { AppointmentService, CancelAppointmentDto } from '../appointment';

@ApiTags('Patient')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PATIENT)
@Controller('patients')
export class PatientController {
  constructor(
    private readonly patientService: PatientService,
    private readonly paymentService: PaymentService,
    private readonly appointmentService: AppointmentService,
  ) {}

  @Patch('me')
  @ApiOperation({ summary: 'Update current patient profile' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Patient profile updated successfully',
  })
  @ApiResponseSwagger({
    status: 400,
    description: 'Bad request - validation error',
  })
  @ApiResponseSwagger({ status: 401, description: 'Unauthorized' })
  @ApiResponseSwagger({ status: 404, description: 'Patient profile not found' })
  async updateMyProfile(
    @CurrentUser('sub') userId: string,
    @Body() updatePatientDto: UpdatePatientDto,
  ) {
    const patient = await this.patientService.updateMyProfile(
      userId,
      updatePatientDto,
    );
    return ApiResponse.success(patient, 'Patient profile updated successfully');
  }

  @Get('me/payments')
  @ApiOperation({ summary: 'Get my payment list' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Payment list retrieved successfully',
  })
  @ApiResponseSwagger({ status: 401, description: 'Unauthorized' })
  async findMyPayments(
    @CurrentUser('sub') userId: string,
    @Query() query: QueryMyPaymentDto,
  ) {
    const patient = await this.patientService.getProfileByUserId(userId);
    if (!patient) {
      ExceptionUtils.throwNotFound('Patient profile not found');
    }
    const result = await this.paymentService.findMyPayments(patient.id, query);
    return PaginatedResponse.create(
      result.data,
      result.total,
      query,
      'Payment list retrieved successfully',
    );
  }

  @Get('me/payments/:id')
  @ApiOperation({ summary: 'Get payment detail by ID' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Payment detail retrieved successfully',
  })
  @ApiResponseSwagger({ status: 401, description: 'Unauthorized' })
  @ApiResponseSwagger({ status: 404, description: 'Payment not found' })
  async findMyPaymentById(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ) {
    const patient = await this.patientService.getProfileByUserId(userId);
    if (!patient) {
      ExceptionUtils.throwNotFound('Patient profile not found');
    }
    const payment = await this.paymentService.findMyPaymentById(id, patient.id);
    return ApiResponse.success(payment, 'Payment detail retrieved successfully');
  }

  @Patch('me/appointments/:id/cancel')
  @ApiOperation({
    summary: 'Cancel my appointment',
    description: `
      Bệnh nhân hủy lịch hẹn của mình.
      
      **Lưu ý quan trọng:**
      - Chỉ có thể hủy lịch hẹn đang ở trạng thái **PENDING** (chờ xác nhận)
      - Không thể hủy lịch hẹn đã được xác nhận (CONFIRMED)
      - Nếu cần hủy lịch đã xác nhận, vui lòng liên hệ hotline hỗ trợ
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Appointment ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponseSwagger({
    status: 200,
    description: 'Appointment cancelled successfully',
  })
  @ApiResponseSwagger({
    status: 400,
    description: 'Cannot cancel confirmed appointment',
  })
  @ApiResponseSwagger({
    status: 403,
    description: 'Not authorized to cancel this appointment',
  })
  @ApiResponseSwagger({ status: 404, description: 'Appointment not found' })
  async cancelMyAppointment(
    @CurrentUser('patientId') patientId: string,
    @Param('id') appointmentId: string,
    @Body() cancelDto: CancelAppointmentDto,
  ) {
    if (!patientId) {
      throw new ForbiddenException(
        'Không tìm thấy thông tin bệnh nhân. Vui lòng liên hệ quản trị viên.',
      );
    }
    const appointment = await this.appointmentService.cancelByPatient(
      appointmentId,
      patientId,
      cancelDto,
    );
    return ApiResponse.success(appointment, 'Hủy lịch hẹn thành công');
  }
}
