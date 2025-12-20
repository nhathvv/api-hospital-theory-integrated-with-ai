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
  @ApiOperation({ summary: 'Lấy danh sách chuyên khoa đang hoạt động' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Lấy danh sách chuyên khoa thành công',
  })
  async findAll(@Query() query: QuerySpecialtyDto) {
    query.isActive = true;
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
}
