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
import { DepartmentService } from './department.service';
import { CreateDepartmentDto, UpdateDepartmentDto, QueryDepartmentDto } from './dto';
import { ApiResponse, PaginatedResponse, UserRole } from '../common';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/decorators';

@ApiTags('Departments')
@ApiBearerAuth('JWT-auth')
@Controller('departments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new department (ADMIN only)' })
  async create(@Body() createDepartmentDto: CreateDepartmentDto) {
    const department = await this.departmentService.create(createDepartmentDto);
    return ApiResponse.success(department, 'Department created successfully', 201);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Get all departments with pagination (ADMIN, DOCTOR)' })
  async findAll(@Query() query: QueryDepartmentDto) {
    const result = await this.departmentService.findAll(query);
    return PaginatedResponse.create(result.data, result.total, query, 'Departments retrieved successfully');
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Get a department by ID (ADMIN, DOCTOR)' })
  @ApiResponseSwagger({ status: 404, description: 'Department not found' })
  async findOne(@Param('id') id: string) {
    const department = await this.departmentService.findOne(id);
    return ApiResponse.success(department, 'Department retrieved successfully');
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a department (ADMIN only)' })
  async update(@Param('id') id: string, @Body() updateDepartmentDto: UpdateDepartmentDto) {
    const department = await this.departmentService.update(id, updateDepartmentDto);
    return ApiResponse.success(department, 'Department updated successfully');
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a department (ADMIN only)' })
  async remove(@Param('id') id: string) {
    const department = await this.departmentService.remove(id);
    return ApiResponse.success(department, 'Department deleted successfully');
  }
}

