import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as ApiResponseSwagger } from '@nestjs/swagger';
import { DoctorService } from './doctor.service';
import { QueryDoctorDto } from './dto';
import { ApiResponse, PaginatedResponse } from '../common/dto';
import { DoctorStatus } from '@prisma/client';

@ApiTags('Public - Doctors')
@Controller('doctors')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active doctors for patients' })
  @ApiResponseSwagger({ status: 200, description: 'Doctors retrieved successfully' })
  async findAll(@Query() query: QueryDoctorDto) {
    query.status = DoctorStatus.ACTIVE;
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
}
