import {
  Controller,
  Get,
  Post,
  Body,
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
import { MedicineCategoryService } from '../../medicine-category/medicine-category.service';
import {
  CreateMedicineCategoryDto,
  QueryMedicineCategoryDto,
} from '../../medicine-category/dto';
import { ApiResponse } from '../../common/dto';
import { UserRole } from '../../common/constants';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles } from '../../auth/decorators';

@ApiTags('Admin - Medicine Category Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/medicine-categories')
export class AdminMedicineCategoryController {
  constructor(
    private readonly medicineCategoryService: MedicineCategoryService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo danh mục thuốc mới' })
  @ApiResponseSwagger({
    status: 201,
    description: 'Tạo danh mục thuốc thành công',
  })
  @ApiResponseSwagger({
    status: 409,
    description: 'Tên hoặc mã danh mục thuốc đã tồn tại',
  })
  async create(@Body() dto: CreateMedicineCategoryDto) {
    const category = await this.medicineCategoryService.create(dto);
    return ApiResponse.success(category, 'Tạo danh mục thuốc thành công', 201);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách danh mục thuốc' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Lấy danh sách danh mục thuốc thành công',
  })
  async findAll(@Query() query: QueryMedicineCategoryDto) {
    const categories = await this.medicineCategoryService.findAll(query);
    return ApiResponse.success(
      categories,
      'Lấy danh sách danh mục thuốc thành công',
    );
  }
}
