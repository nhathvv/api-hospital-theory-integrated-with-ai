import { Controller, Get, Query, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as ApiResponseSwagger,
} from '@nestjs/swagger';
import { SpecialtyService } from './specialty.service';
import { QuerySpecialtyDto } from './dto';
import { ApiResponse, PaginatedResponse } from '../common/dto';

@ApiTags('Public - Specialties')
@Controller('specialties')
export class SpecialtyController {
  constructor(private readonly specialtyService: SpecialtyService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active specialties for patients' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Specialties retrieved successfully',
  })
  async findAll(@Query() query: QuerySpecialtyDto) {
    query.isActive = true;
    const result = await this.specialtyService.findAll(query);
    return PaginatedResponse.create(
      result.data,
      result.total,
      query,
      'Specialties retrieved successfully',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specialty detail by ID' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Specialty retrieved successfully',
  })
  @ApiResponseSwagger({ status: 404, description: 'Specialty not found' })
  async findOne(@Param('id') id: string) {
    const specialty = await this.specialtyService.findOne(id);
    return ApiResponse.success(specialty, 'Specialty retrieved successfully');
  }
}
