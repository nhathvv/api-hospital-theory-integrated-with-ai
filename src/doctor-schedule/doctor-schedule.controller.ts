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
import {
  ApiTags,
  ApiOperation,
  ApiResponse as ApiResponseSwagger,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DoctorScheduleService } from './doctor-schedule.service';
import {
  CreateDoctorScheduleDto,
  UpdateDoctorScheduleDto,
  QueryDoctorScheduleDto,
  QueryAvailableSlotsDto,
} from './dto';
import { ApiResponse, PaginatedResponse, UserRole } from '../common';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/decorators';

@ApiTags('Doctor Schedules')
@ApiBearerAuth('JWT-auth')
@Controller('admin/doctor-schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DoctorScheduleController {
  constructor(private readonly doctorScheduleService: DoctorScheduleService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo lịch làm việc cho bác sĩ (Chỉ ADMIN)' })
  @ApiResponseSwagger({ status: 201, description: 'Tạo lịch làm việc thành công' })
  @ApiResponseSwagger({ status: 404, description: 'Không tìm thấy bác sĩ' })
  @ApiResponseSwagger({ status: 409, description: 'Lịch làm việc bị trùng' })
  async create(@Body() createDto: CreateDoctorScheduleDto) {
    const schedule = await this.doctorScheduleService.create(createDto);
    return ApiResponse.success(schedule, 'Tạo lịch làm việc thành công', 201);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Lấy danh sách lịch làm việc có phân trang (ADMIN, BÁC SĨ)' })
  @ApiResponseSwagger({ status: 200, description: 'Lấy danh sách lịch làm việc thành công' })
  async findAll(@Query() query: QueryDoctorScheduleDto) {
    const result = await this.doctorScheduleService.findAll(query);
    return PaginatedResponse.create(result.data, result.total, query, 'Lấy danh sách lịch làm việc thành công');
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Lấy chi tiết lịch làm việc theo ID (ADMIN, BÁC SĨ)' })
  @ApiResponseSwagger({ status: 200, description: 'Lấy chi tiết lịch làm việc thành công' })
  @ApiResponseSwagger({ status: 404, description: 'Không tìm thấy lịch làm việc' })
  async findOne(@Param('id') id: string) {
    const schedule = await this.doctorScheduleService.findOne(id);
    return ApiResponse.success(schedule, 'Lấy chi tiết lịch làm việc thành công');
  }

  @Get('doctor/:doctorId')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Lấy danh sách lịch làm việc theo bác sĩ (ADMIN, BÁC SĨ)' })
  @ApiResponseSwagger({ status: 200, description: 'Lấy danh sách lịch làm việc thành công' })
  @ApiResponseSwagger({ status: 404, description: 'Không tìm thấy bác sĩ' })
  async findByDoctorId(@Param('doctorId') doctorId: string) {
    const schedules = await this.doctorScheduleService.findByDoctorId(doctorId);
    return ApiResponse.success(schedules, 'Lấy danh sách lịch làm việc thành công');
  }

  @Get('doctor/:doctorId/available-slots')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT)
  @ApiOperation({ summary: 'Lấy khung giờ trống của bác sĩ theo ngày cụ thể' })
  @ApiResponseSwagger({ status: 200, description: 'Lấy khung giờ trống thành công' })
  @ApiResponseSwagger({ status: 404, description: 'Không tìm thấy bác sĩ' })
  async getAvailableSlots(
    @Param('doctorId') doctorId: string,
    @Query() query: QueryAvailableSlotsDto,
  ) {
    const slots = await this.doctorScheduleService.getAvailableSlots(doctorId, query);
    return ApiResponse.success(slots, 'Lấy khung giờ trống thành công');
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Cập nhật lịch làm việc (Chỉ ADMIN)' })
  @ApiResponseSwagger({ status: 200, description: 'Cập nhật lịch làm việc thành công' })
  @ApiResponseSwagger({ status: 404, description: 'Không tìm thấy lịch làm việc' })
  @ApiResponseSwagger({ status: 409, description: 'Lịch làm việc bị trùng' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateDoctorScheduleDto) {
    const schedule = await this.doctorScheduleService.update(id, updateDto);
    return ApiResponse.success(schedule, 'Cập nhật lịch làm việc thành công');
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa lịch làm việc (Chỉ ADMIN)' })
  @ApiResponseSwagger({ status: 200, description: 'Xóa lịch làm việc thành công' })
  @ApiResponseSwagger({ status: 404, description: 'Không tìm thấy lịch làm việc' })
  async remove(@Param('id') id: string) {
    const schedule = await this.doctorScheduleService.remove(id);
    return ApiResponse.success(schedule, 'Xóa lịch làm việc thành công');
  }
}
