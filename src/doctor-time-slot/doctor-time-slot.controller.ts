import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  Patch,
  Delete,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { DoctorTimeSlotService } from './doctor-time-slot.service';
import {
  CreateDoctorScheduleDto,
  QueryDoctorScheduleDto,
  UpdateDoctorScheduleDto,
} from './dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/decorators';
import { UserRole } from '../common/constants';
import { PaginatedResponse } from '../common/dto';

@ApiTags('Admin - Doctor Time Slot Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('/admin/doctor-schedules')
export class DoctorTimeSlotController {
  constructor(private readonly doctorTimeSlotService: DoctorTimeSlotService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create doctor schedule with time slots' })
  @ApiResponse({ status: 201, description: 'Schedule created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'Doctor not found' })
  @ApiResponse({ status: 409, description: 'Conflict - overlapping schedule' })
  async create(@Body() dto: CreateDoctorScheduleDto) {
    return this.doctorTimeSlotService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all doctor schedules with filters' })
  @ApiResponse({ status: 200, description: 'Schedules retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async findAll(@Query() query: QueryDoctorScheduleDto) {
    const result = await this.doctorTimeSlotService.findAll(query);
    return PaginatedResponse.create(
      result.data,
      result.total,
      query,
      'Schedules retrieved successfully',
    );
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get schedule by ID' })
  @ApiParam({ name: 'id', description: 'Schedule ID' })
  @ApiResponse({ status: 200, description: 'Schedule retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.doctorTimeSlotService.findOne(id);
  }

  @Get('doctor/:doctorId')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Get schedules by doctor ID' })
  @ApiParam({ name: 'doctorId', description: 'Doctor ID' })
  @ApiResponse({ status: 200, description: 'Schedules retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Doctor not found' })
  async findByDoctor(
    @Param('doctorId', ParseUUIDPipe) doctorId: string,
    @Query() query: QueryDoctorScheduleDto,
  ) {
    const result = await this.doctorTimeSlotService.findByDoctor(
      doctorId,
      query,
    );
    return PaginatedResponse.create(
      result.data,
      result.total,
      query,
      'Schedules retrieved successfully',
    );
  }

  @Get('doctor/:doctorId/available-slots')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT)
  @ApiOperation({ summary: 'Get available time slots for a doctor on a date' })
  @ApiParam({ name: 'doctorId', description: 'Doctor ID' })
  @ApiResponse({ status: 200, description: 'Available slots retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Doctor not found' })
  async getAvailableSlots(
    @Param('doctorId', ParseUUIDPipe) doctorId: string,
    @Query('date') date: string,
  ) {
    return this.doctorTimeSlotService.getAvailableSlots(doctorId, date);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update schedule' })
  @ApiParam({ name: 'id', description: 'Schedule ID' })
  @ApiResponse({ status: 200, description: 'Schedule updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  @ApiResponse({ status: 409, description: 'Conflict - overlapping schedule' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDoctorScheduleDto,
  ) {
    return this.doctorTimeSlotService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete schedule' })
  @ApiParam({ name: 'id', description: 'Schedule ID' })
  @ApiResponse({ status: 200, description: 'Schedule deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.doctorTimeSlotService.remove(id);
  }
}
