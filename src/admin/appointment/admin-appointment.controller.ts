import {
  Controller,
  Get,
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
  @ApiOperation({ summary: 'Get all appointments with filters' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Appointments retrieved successfully',
  })
  async findAll(@Query() query: QueryAppointmentDto) {
    const { data, totalItems } = await this.appointmentService.findAll(query);
    return PaginatedResponse.create(
      data,
      totalItems,
      query,
      'Appointments retrieved successfully',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get appointment detail by ID' })
  @ApiParam({
    name: 'id',
    description: 'Appointment ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponseSwagger({
    status: 200,
    description: 'Appointment retrieved successfully',
  })
  @ApiResponseSwagger({ status: 404, description: 'Appointment not found' })
  async findById(@Param('id') id: string) {
    const appointment = await this.appointmentService.findById(id);
    return ApiResponse.success(appointment, 'Appointment retrieved successfully');
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update appointment status',
    description: `
      Admin can update appointment status.
      
      **Valid status transitions:**
      - PENDING → CONFIRMED, CANCELLED
      - CONFIRMED → IN_PROGRESS, CANCELLED, NO_SHOW
      - IN_PROGRESS → COMPLETED
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Appointment ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponseSwagger({
    status: 200,
    description: 'Appointment status updated successfully',
  })
  @ApiResponseSwagger({
    status: 400,
    description: 'Invalid status transition',
  })
  @ApiResponseSwagger({ status: 404, description: 'Appointment not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentStatusDto,
  ) {
    const appointment = await this.appointmentService.updateStatus(id, dto.status);
    return ApiResponse.success(appointment, 'Appointment status updated successfully');
  }

  @Patch(':id/cancel')
  @ApiOperation({
    summary: 'Cancel appointment',
    description: 'Admin can cancel any appointment with PENDING or CONFIRMED status',
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
    description: 'Cannot cancel appointment with current status',
  })
  @ApiResponseSwagger({ status: 404, description: 'Appointment not found' })
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
    return ApiResponse.success(appointment, 'Appointment cancelled successfully');
  }
}
