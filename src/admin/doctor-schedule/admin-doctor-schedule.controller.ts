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
  @ApiOperation({ summary: 'Tạo lịch làm việc bác sĩ' })
  @ApiResponseSwagger({
    status: 201,
    description: 'Tạo lịch làm việc thành công',
  })
  @ApiResponseSwagger({ status: 404, description: 'Không tìm thấy bác sĩ' })
  @ApiResponseSwagger({ status: 409, description: 'Lịch làm việc bị trùng' })
  async create(@Body() createDto: CreateDoctorScheduleDto) {
    const schedule = await this.doctorScheduleService.create(createDto);
    return ApiResponse.success(schedule, 'Tạo lịch làm việc thành công', 201);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách lịch làm việc với phân trang' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Lấy danh sách lịch làm việc thành công',
  })
  async findAll(@Query() query: QueryDoctorScheduleDto) {
    const result = await this.doctorScheduleService.findAll(query);
    return PaginatedResponse.create(
      result.data,
      result.total,
      query,
      'Lấy danh sách lịch làm việc thành công',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết lịch làm việc' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Lấy thông tin lịch làm việc thành công',
  })
  @ApiResponseSwagger({ status: 404, description: 'Không tìm thấy lịch làm việc' })
  async findOne(@Param('id') id: string) {
    const schedule = await this.doctorScheduleService.findOne(id);
    return ApiResponse.success(schedule, 'Lấy thông tin lịch làm việc thành công');
  }

  @Get('doctor/:doctorId')
  @ApiOperation({ summary: 'Lấy lịch làm việc theo bác sĩ' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Lấy lịch làm việc thành công',
  })
  @ApiResponseSwagger({ status: 404, description: 'Không tìm thấy bác sĩ' })
  async findByDoctorId(@Param('doctorId') doctorId: string) {
    const schedules = await this.doctorScheduleService.findByDoctorId(doctorId);
    return ApiResponse.success(schedules, 'Lấy lịch làm việc thành công');
  }

  @Get('doctor/:doctorId/available-slots')
  @ApiOperation({
    summary: 'Lấy khung giờ trống của bác sĩ theo ngày',
  })
  @ApiResponseSwagger({
    status: 200,
    description: 'Lấy khung giờ trống thành công',
  })
  @ApiResponseSwagger({ status: 404, description: 'Không tìm thấy bác sĩ' })
  async getAvailableSlots(
    @Param('doctorId') doctorId: string,
    @Query() query: QueryAvailableSlotsDto,
  ) {
    const slots = await this.doctorScheduleService.getAvailableSlots(
      doctorId,
      query,
    );
    return ApiResponse.success(slots, 'Lấy khung giờ trống thành công');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật lịch làm việc' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Cập nhật lịch làm việc thành công',
  })
  @ApiResponseSwagger({ status: 404, description: 'Không tìm thấy lịch làm việc' })
  @ApiResponseSwagger({ status: 409, description: 'Lịch làm việc bị trùng' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateDoctorScheduleDto,
  ) {
    const schedule = await this.doctorScheduleService.update(id, updateDto);
    return ApiResponse.success(schedule, 'Cập nhật lịch làm việc thành công');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa lịch làm việc' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Xóa lịch làm việc thành công',
  })
  @ApiResponseSwagger({ status: 404, description: 'Không tìm thấy lịch làm việc' })
  async remove(@Param('id') id: string) {
    const schedule = await this.doctorScheduleService.remove(id);
    return ApiResponse.success(schedule, 'Xóa lịch làm việc thành công');
  }
}
