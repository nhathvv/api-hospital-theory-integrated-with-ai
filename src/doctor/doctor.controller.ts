import { Controller, Post, Body, UseGuards, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as ApiResponseSwagger, ApiBearerAuth } from '@nestjs/swagger';
import { DoctorService } from './doctor.service';
import { CreateDoctorDto, QueryDoctorDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/decorators';
import { UserRole } from '../common/constants';
import { ApiResponse, PaginatedResponse } from 'src/common/dto';

@ApiTags('Admin - Doctor Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('/admin/doctors')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all doctors with filters' })
  @ApiResponseSwagger({ status: 200, description: 'Doctors retrieved successfully' })
  @ApiResponseSwagger({ status: 401, description: 'Unauthorized' })
  @ApiResponseSwagger({ status: 403, description: 'Forbidden - Admin only' })
  async findAll(@Query() query: QueryDoctorDto) {
    const result = await this.doctorService.findAll(query);
    return PaginatedResponse.create(result.data, result.total, query, 'Doctors retrieved successfully');
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get doctor detail by ID' })
  @ApiResponseSwagger({ status: 200, description: 'Doctor retrieved successfully' })
  @ApiResponseSwagger({ status: 401, description: 'Unauthorized' })
  @ApiResponseSwagger({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponseSwagger({ status: 404, description: 'Doctor not found' })
  async findOne(@Param('id') id: string) {
    const doctor = await this.doctorService.findOne(id);
    return ApiResponse.success(doctor, 'Doctor retrieved successfully');
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create new doctor' })
  @ApiResponseSwagger({ status: 201, description: 'Doctor created successfully' })
  @ApiResponseSwagger({ status: 400, description: 'Bad request - validation error' })
  @ApiResponseSwagger({ status: 401, description: 'Unauthorized' })
  @ApiResponseSwagger({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponseSwagger({ status: 409, description: 'Conflict - email or license already exists' })
  async create(@Body() createDoctorDto: CreateDoctorDto) {
    return this.doctorService.create(createDoctorDto);
  }
}

