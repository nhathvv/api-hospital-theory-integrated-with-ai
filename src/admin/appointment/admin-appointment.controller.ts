import {
  Controller,
  Get,
  Post,
  Patch,
  Query,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as ApiResponseSwagger,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AppointmentService } from '../../appointment/appointment.service';
import {
  QueryAppointmentDto,
  CancelAppointmentDto,
} from '../../appointment/dto';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles, CurrentUser } from '../../auth/decorators';
import { UserRole } from '../../common/constants';
import { ApiResponse, PaginatedResponse } from '../../common/dto';
import { UpdateAppointmentStatusDto } from './dto';

@ApiTags('Admin - Appointment Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/appointments')
export class AdminAppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách lịch hẹn với bộ lọc' })
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

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết lịch hẹn' })
  @ApiParam({
    name: 'id',
    description: 'ID lịch hẹn',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponseSwagger({
    status: 200,
    description: 'Lấy thông tin lịch hẹn thành công',
  })
  @ApiResponseSwagger({ status: 404, description: 'Không tìm thấy lịch hẹn' })
  async findById(@Param('id') id: string) {
    const appointment = await this.appointmentService.findById(id);
    return ApiResponse.success(appointment, 'Lấy thông tin lịch hẹn thành công');
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Cập nhật trạng thái lịch hẹn',
    description: `
      Admin có thể cập nhật trạng thái lịch hẹn.
      
      **Chuyển đổi trạng thái hợp lệ:**
      - PENDING → CONFIRMED, CANCELLED
      - CONFIRMED → IN_PROGRESS, CANCELLED, NO_SHOW
      - IN_PROGRESS → COMPLETED
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'ID lịch hẹn',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponseSwagger({
    status: 200,
    description: 'Cập nhật trạng thái lịch hẹn thành công',
  })
  @ApiResponseSwagger({
    status: 400,
    description: 'Chuyển đổi trạng thái không hợp lệ',
  })
  @ApiResponseSwagger({ status: 404, description: 'Không tìm thấy lịch hẹn' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentStatusDto,
  ) {
    const appointment = await this.appointmentService.updateStatus(id, dto.status);
    return ApiResponse.success(appointment, 'Cập nhật trạng thái lịch hẹn thành công');
  }

  @Post(':id/cancel')
  @ApiOperation({
    summary: 'Hủy lịch hẹn',
    description: 'Admin có thể hủy bất kỳ lịch hẹn nào có trạng thái PENDING hoặc CONFIRMED',
  })
  @ApiParam({
    name: 'id',
    description: 'ID lịch hẹn',
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
  @ApiResponseSwagger({ status: 404, description: 'Không tìm thấy lịch hẹn' })
  async cancel(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() cancelDto: CancelAppointmentDto,
  ) {
    const appointment = await this.appointmentService.cancelByAdmin(
      id,
      userId,
      cancelDto,
    );
    return ApiResponse.success(appointment, 'Hủy lịch hẹn thành công');
  }
}
