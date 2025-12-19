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
import { DepartmentService } from '../../department/department.service';
import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
  QueryDepartmentDto,
} from '../../department/dto';
import { ApiResponse, PaginatedResponse } from '../../common/dto';
import { UserRole } from '../../common/constants';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles } from '../../auth/decorators';

@ApiTags('Admin - Department Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/departments')
export class AdminDepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new department' })
  @ApiResponseSwagger({
    status: 201,
    description: 'Department created successfully',
  })
  @ApiResponseSwagger({
    status: 409,
    description: 'Department name or code already exists',
  })
  async create(@Body() createDepartmentDto: CreateDepartmentDto) {
    const department = await this.departmentService.create(createDepartmentDto);
    return ApiResponse.success(
      department,
      'Department created successfully',
      201,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all departments with pagination' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Departments retrieved successfully',
  })
  async findAll(@Query() query: QueryDepartmentDto) {
    const result = await this.departmentService.findAll(query);
    return PaginatedResponse.create(
      result.data,
      result.total,
      query,
      'Departments retrieved successfully',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a department by ID' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Department retrieved successfully',
  })
  @ApiResponseSwagger({ status: 404, description: 'Department not found' })
  async findOne(@Param('id') id: string) {
    const department = await this.departmentService.findOne(id);
    return ApiResponse.success(department, 'Department retrieved successfully');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a department' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Department updated successfully',
  })
  @ApiResponseSwagger({ status: 404, description: 'Department not found' })
  @ApiResponseSwagger({
    status: 409,
    description: 'Department name or code already exists',
  })
  async update(
    @Param('id') id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    const department = await this.departmentService.update(
      id,
      updateDepartmentDto,
    );
    return ApiResponse.success(department, 'Department updated successfully');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a department' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Department deleted successfully',
  })
  @ApiResponseSwagger({ status: 404, description: 'Department not found' })
  async remove(@Param('id') id: string) {
    const department = await this.departmentService.remove(id);
    return ApiResponse.success(department, 'Department deleted successfully');
  }
}
