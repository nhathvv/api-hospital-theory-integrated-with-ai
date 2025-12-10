import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as ApiResponseSwagger, ApiBearerAuth } from '@nestjs/swagger';
import { DoctorScheduleService } from '../../doctor-schedule/doctor-schedule.service';
import {
  CreateDoctorScheduleDto,
  UpdateDoctorScheduleDto,
  QueryDoctorScheduleDto,
  QueryAvailableSlotsDto,
} from '../../doctor-schedule/dto';
import { ApiResponse, PaginatedResponse } from '../../common/dto';
import { UserRole } from '../../common/constants';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles } from '../../auth/decorators';

@ApiTags('Admin - Doctor Schedule Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/doctor-schedules')
export class AdminDoctorScheduleController {
  constructor(private readonly doctorScheduleService: DoctorScheduleService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create doctor schedule' })
  @ApiResponseSwagger({ status: 201, description: 'Schedule created successfully' })
  @ApiResponseSwagger({ status: 404, description: 'Doctor not found' })
  @ApiResponseSwagger({ status: 409, description: 'Schedule overlaps' })
  async create(@Body() createDto: CreateDoctorScheduleDto) {
    const schedule = await this.doctorScheduleService.create(createDto);
    return ApiResponse.success(schedule, 'Schedule created successfully', 201);
  }

  @Get()
  @ApiOperation({ summary: 'Get all schedules with pagination' })
  @ApiResponseSwagger({ status: 200, description: 'Schedules retrieved successfully' })
  async findAll(@Query() query: QueryDoctorScheduleDto) {
    const result = await this.doctorScheduleService.findAll(query);
    return PaginatedResponse.create(result.data, result.total, query, 'Schedules retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get schedule detail by ID' })
  @ApiResponseSwagger({ status: 200, description: 'Schedule retrieved successfully' })
  @ApiResponseSwagger({ status: 404, description: 'Schedule not found' })
  async findOne(@Param('id') id: string) {
    const schedule = await this.doctorScheduleService.findOne(id);
    return ApiResponse.success(schedule, 'Schedule retrieved successfully');
  }

  @Get('doctor/:doctorId')
  @ApiOperation({ summary: 'Get schedules by doctor ID' })
  @ApiResponseSwagger({ status: 200, description: 'Schedules retrieved successfully' })
  @ApiResponseSwagger({ status: 404, description: 'Doctor not found' })
  async findByDoctorId(@Param('doctorId') doctorId: string) {
    const schedules = await this.doctorScheduleService.findByDoctorId(doctorId);
    return ApiResponse.success(schedules, 'Schedules retrieved successfully');
  }

  @Get('doctor/:doctorId/available-slots')
  @ApiOperation({ summary: 'Get available slots for a doctor on specific date' })
  @ApiResponseSwagger({ status: 200, description: 'Available slots retrieved successfully' })
  @ApiResponseSwagger({ status: 404, description: 'Doctor not found' })
  async getAvailableSlots(
    @Param('doctorId') doctorId: string,
    @Query() query: QueryAvailableSlotsDto,
  ) {
    const slots = await this.doctorScheduleService.getAvailableSlots(doctorId, query);
    return ApiResponse.success(slots, 'Available slots retrieved successfully');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update schedule' })
  @ApiResponseSwagger({ status: 200, description: 'Schedule updated successfully' })
  @ApiResponseSwagger({ status: 404, description: 'Schedule not found' })
  @ApiResponseSwagger({ status: 409, description: 'Schedule overlaps' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateDoctorScheduleDto) {
    const schedule = await this.doctorScheduleService.update(id, updateDto);
    return ApiResponse.success(schedule, 'Schedule updated successfully');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete schedule' })
  @ApiResponseSwagger({ status: 200, description: 'Schedule deleted successfully' })
  @ApiResponseSwagger({ status: 404, description: 'Schedule not found' })
  async remove(@Param('id') id: string) {
    const schedule = await this.doctorScheduleService.remove(id);
    return ApiResponse.success(schedule, 'Schedule deleted successfully');
  }
}
