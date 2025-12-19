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
import { SpecialtyService } from '../../specialty/specialty.service';
import {
  CreateSpecialtyDto,
  UpdateSpecialtyDto,
  QuerySpecialtyDto,
} from '../../specialty/dto';
import { ApiResponse, PaginatedResponse } from '../../common/dto';
import { UserRole } from '../../common/constants';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles } from '../../auth/decorators';

@ApiTags('Admin - Specialty Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/specialties')
export class AdminSpecialtyController {
  constructor(private readonly specialtyService: SpecialtyService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new specialty' })
  @ApiResponseSwagger({
    status: 201,
    description: 'Specialty created successfully',
  })
  @ApiResponseSwagger({
    status: 409,
    description: 'Specialty name already exists',
  })
  async create(@Body() createSpecialtyDto: CreateSpecialtyDto) {
    const specialty = await this.specialtyService.create(createSpecialtyDto);
    return ApiResponse.success(
      specialty,
      'Specialty created successfully',
      201,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all specialties with pagination' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Specialties retrieved successfully',
  })
  async findAll(@Query() query: QuerySpecialtyDto) {
    const result = await this.specialtyService.findAll(query);
    return PaginatedResponse.create(
      result.data,
      result.total,
      query,
      'Specialties retrieved successfully',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specialty by ID' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Specialty retrieved successfully',
  })
  @ApiResponseSwagger({ status: 404, description: 'Specialty not found' })
  async findOne(@Param('id') id: string) {
    const specialty = await this.specialtyService.findOne(id);
    return ApiResponse.success(specialty, 'Specialty retrieved successfully');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a specialty' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Specialty updated successfully',
  })
  @ApiResponseSwagger({ status: 404, description: 'Specialty not found' })
  @ApiResponseSwagger({
    status: 409,
    description: 'Specialty name already exists',
  })
  async update(
    @Param('id') id: string,
    @Body() updateSpecialtyDto: UpdateSpecialtyDto,
  ) {
    const specialty = await this.specialtyService.update(
      id,
      updateSpecialtyDto,
    );
    return ApiResponse.success(specialty, 'Specialty updated successfully');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a specialty' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Specialty deleted successfully',
  })
  @ApiResponseSwagger({ status: 404, description: 'Specialty not found' })
  async remove(@Param('id') id: string) {
    const specialty = await this.specialtyService.remove(id);
    return ApiResponse.success(specialty, 'Specialty deleted successfully');
  }
}
