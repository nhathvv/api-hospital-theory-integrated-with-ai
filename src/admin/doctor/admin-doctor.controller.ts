import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Query,
  Param,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as ApiResponseSwagger,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DoctorService } from '../../doctor/doctor.service';
import { CreateDoctorDto, QueryDoctorDto } from '../../doctor/dto';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles } from '../../auth/decorators';
import { UserRole } from '../../common/constants';
import { ApiResponse, PaginatedResponse } from '../../common/dto';

@ApiTags('Admin - Doctor Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/doctors')
export class AdminDoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách bác sĩ với bộ lọc' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Lấy danh sách bác sĩ thành công',
  })
  async findAll(@Query() query: QueryDoctorDto) {
    const result = await this.doctorService.findAll(query);
    return PaginatedResponse.create(
      result.data,
      result.total,
      query,
      'Lấy danh sách bác sĩ thành công',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết bác sĩ' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Lấy thông tin bác sĩ thành công',
  })
  @ApiResponseSwagger({ status: 404, description: 'Không tìm thấy bác sĩ' })
  async findOne(@Param('id') id: string) {
    const doctor = await this.doctorService.findOne(id);
    return ApiResponse.success(doctor, 'Lấy thông tin bác sĩ thành công');
  }

  @Post()
  @ApiOperation({ summary: 'Tạo bác sĩ mới' })
  @ApiResponseSwagger({
    status: 201,
    description: 'Tạo bác sĩ thành công',
  })
  @ApiResponseSwagger({
    status: 409,
    description: 'Email hoặc số giấy phép đã tồn tại',
  })
  async create(@Body() createDoctorDto: CreateDoctorDto) {
    const doctor = await this.doctorService.create(createDoctorDto);
    return ApiResponse.success(doctor, 'Tạo bác sĩ thành công', 201);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa mềm bác sĩ' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Xóa bác sĩ thành công',
  })
  @ApiResponseSwagger({ status: 404, description: 'Không tìm thấy bác sĩ' })
  async remove(@Param('id') id: string) {
    await this.doctorService.remove(id);
    return ApiResponse.success(null, 'Xóa bác sĩ thành công');
  }
}
