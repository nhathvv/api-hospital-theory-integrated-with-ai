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
import { SpecialtyService } from './specialty.service';
import {
  CreateSpecialtyDto,
  UpdateSpecialtyDto,
  QuerySpecialtyDto,
} from './dto';
import { ApiResponse, PaginatedResponse, UserRole } from '../common';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/decorators';

@ApiTags('Specialties')
@ApiBearerAuth('JWT-auth')
@Controller('specialties')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SpecialtyController {
  constructor(private readonly specialtyService: SpecialtyService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new specialty (ADMIN only)' })
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
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({
    summary: 'Get all specialties with pagination (ADMIN, DOCTOR)',
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
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Get a specialty by ID (ADMIN, DOCTOR)' })
  @ApiResponseSwagger({ status: 404, description: 'Specialty not found' })
  async findOne(@Param('id') id: string) {
    const specialty = await this.specialtyService.findOne(id);
    return ApiResponse.success(specialty, 'Specialty retrieved successfully');
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a specialty (ADMIN only)' })
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
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a specialty (ADMIN only)' })
  @ApiResponseSwagger({ status: 404, description: 'Specialty not found' })
  async remove(@Param('id') id: string) {
    const specialty = await this.specialtyService.remove(id);
    return ApiResponse.success(specialty, 'Specialty deleted successfully');
  }
}
