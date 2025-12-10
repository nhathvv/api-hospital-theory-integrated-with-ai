import { Controller, Post, Body, UseGuards, Get, Query, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as ApiResponseSwagger, ApiBearerAuth } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Get all doctors with filters' })
  @ApiResponseSwagger({ status: 200, description: 'Doctors retrieved successfully' })
  async findAll(@Query() query: QueryDoctorDto) {
    const result = await this.doctorService.findAll(query);
    return PaginatedResponse.create(result.data, result.total, query, 'Doctors retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get doctor detail by ID' })
  @ApiResponseSwagger({ status: 200, description: 'Doctor retrieved successfully' })
  @ApiResponseSwagger({ status: 404, description: 'Doctor not found' })
  async findOne(@Param('id') id: string) {
    const doctor = await this.doctorService.findOne(id);
    return ApiResponse.success(doctor, 'Doctor retrieved successfully');
  }

  @Post()
  @ApiOperation({ summary: 'Create new doctor' })
  @ApiResponseSwagger({ status: 201, description: 'Doctor created successfully' })
  @ApiResponseSwagger({ status: 409, description: 'Email or license already exists' })
  async create(@Body() createDoctorDto: CreateDoctorDto) {
    const doctor = await this.doctorService.create(createDoctorDto);
    return ApiResponse.success(doctor, 'Doctor created successfully', 201);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete doctor by ID' })
  @ApiResponseSwagger({ status: 200, description: 'Doctor deleted successfully' })
  @ApiResponseSwagger({ status: 404, description: 'Doctor not found' })
  async remove(@Param('id') id: string) {
    await this.doctorService.remove(id);
    return ApiResponse.success(null, 'Doctor deleted successfully');
  }
}
