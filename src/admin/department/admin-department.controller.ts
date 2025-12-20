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
  @ApiOperation({ summary: 'Tạo khoa/phòng ban mới' })
  @ApiResponseSwagger({
    status: 201,
    description: 'Tạo khoa/phòng ban thành công',
  })
  @ApiResponseSwagger({
    status: 409,
    description: 'Tên hoặc mã khoa/phòng ban đã tồn tại',
  })
  async create(@Body() createDepartmentDto: CreateDepartmentDto) {
    const department = await this.departmentService.create(createDepartmentDto);
    return ApiResponse.success(
      department,
      'Tạo khoa/phòng ban thành công',
      201,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách khoa/phòng ban với phân trang' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Lấy danh sách khoa/phòng ban thành công',
  })
  async findAll(@Query() query: QueryDepartmentDto) {
    const result = await this.departmentService.findAll(query);
    return PaginatedResponse.create(
      result.data,
      result.total,
      query,
      'Lấy danh sách khoa/phòng ban thành công',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết khoa/phòng ban' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Lấy thông tin khoa/phòng ban thành công',
  })
  @ApiResponseSwagger({ status: 404, description: 'Không tìm thấy khoa/phòng ban' })
  async findOne(@Param('id') id: string) {
    const department = await this.departmentService.findOne(id);
    return ApiResponse.success(department, 'Lấy thông tin khoa/phòng ban thành công');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật khoa/phòng ban' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Cập nhật khoa/phòng ban thành công',
  })
  @ApiResponseSwagger({ status: 404, description: 'Không tìm thấy khoa/phòng ban' })
  @ApiResponseSwagger({
    status: 409,
    description: 'Tên hoặc mã khoa/phòng ban đã tồn tại',
  })
  async update(
    @Param('id') id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    const department = await this.departmentService.update(
      id,
      updateDepartmentDto,
    );
    return ApiResponse.success(department, 'Cập nhật khoa/phòng ban thành công');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa khoa/phòng ban' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Xóa khoa/phòng ban thành công',
  })
  @ApiResponseSwagger({ status: 404, description: 'Không tìm thấy khoa/phòng ban' })
  async remove(@Param('id') id: string) {
    const department = await this.departmentService.remove(id);
    return ApiResponse.success(department, 'Xóa khoa/phòng ban thành công');
  }
}
