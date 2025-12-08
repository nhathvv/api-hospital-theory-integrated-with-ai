import { Controller, Post, Body, UseGuards, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DoctorService } from './doctor.service';
import { CreateDoctorDto, QueryDoctorDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/decorators';
import { UserRole } from '../common/constants';
import { PaginatedResponse } from 'src/common/dto';

@ApiTags('Admin - Doctor Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('/admin/doctors')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all doctors with filters' })
  @ApiResponse({ status: 200, description: 'Doctors retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async findAll(@Query() query: QueryDoctorDto) {
    const result = await this.doctorService.findAll(query);
    return PaginatedResponse.create(
      result.data,
      result.total,
      query,
      'Doctors retrieved successfully',
    );
  }
  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create new doctor' })
  @ApiResponse({ status: 201, description: 'Doctor created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - email or license already exists',
  })
  async create(@Body() createDoctorDto: CreateDoctorDto) {
    return this.doctorService.create(createDoctorDto);
  }
}
