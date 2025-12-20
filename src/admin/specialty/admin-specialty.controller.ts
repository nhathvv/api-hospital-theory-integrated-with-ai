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
  @ApiOperation({ summary: 'Tạo chuyên khoa mới' })
  @ApiResponseSwagger({
    status: 201,
    description: 'Tạo chuyên khoa thành công',
  })
  @ApiResponseSwagger({
    status: 409,
    description: 'Tên chuyên khoa đã tồn tại',
  })
  async create(@Body() createSpecialtyDto: CreateSpecialtyDto) {
    const specialty = await this.specialtyService.create(createSpecialtyDto);
    return ApiResponse.success(specialty, 'Tạo chuyên khoa thành công', 201);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách chuyên khoa với phân trang' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Lấy danh sách chuyên khoa thành công',
  })
  async findAll(@Query() query: QuerySpecialtyDto) {
    const result = await this.specialtyService.findAll(query);
    return PaginatedResponse.create(
      result.data,
      result.total,
      query,
      'Lấy danh sách chuyên khoa thành công',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết chuyên khoa' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Lấy thông tin chuyên khoa thành công',
  })
  @ApiResponseSwagger({ status: 404, description: 'Không tìm thấy chuyên khoa' })
  async findOne(@Param('id') id: string) {
    const specialty = await this.specialtyService.findOne(id);
    return ApiResponse.success(specialty, 'Lấy thông tin chuyên khoa thành công');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật chuyên khoa' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Cập nhật chuyên khoa thành công',
  })
  @ApiResponseSwagger({ status: 404, description: 'Không tìm thấy chuyên khoa' })
  @ApiResponseSwagger({
    status: 409,
    description: 'Tên chuyên khoa đã tồn tại',
  })
  async update(
    @Param('id') id: string,
    @Body() updateSpecialtyDto: UpdateSpecialtyDto,
  ) {
    const specialty = await this.specialtyService.update(
      id,
      updateSpecialtyDto,
    );
    return ApiResponse.success(specialty, 'Cập nhật chuyên khoa thành công');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa chuyên khoa' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Xóa chuyên khoa thành công',
  })
  @ApiResponseSwagger({ status: 404, description: 'Không tìm thấy chuyên khoa' })
  async remove(@Param('id') id: string) {
    const specialty = await this.specialtyService.remove(id);
    return ApiResponse.success(specialty, 'Xóa chuyên khoa thành công');
  }
}
