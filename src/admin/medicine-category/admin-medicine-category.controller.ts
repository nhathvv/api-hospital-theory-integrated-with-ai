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
  @ApiOperation({ summary: 'Create a new medicine category' })
  @ApiResponseSwagger({
    status: 201,
    description: 'Medicine category created successfully',
  })
  @ApiResponseSwagger({
    status: 409,
    description: 'Medicine category name or code already exists',
  })
  async create(@Body() dto: CreateMedicineCategoryDto) {
    const category = await this.medicineCategoryService.create(dto);
    return ApiResponse.success(
      category,
      'Medicine category created successfully',
      201,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all medicine categories (no pagination)' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Medicine categories retrieved successfully',
  })
  async findAll(@Query() query: QueryMedicineCategoryDto) {
    const categories = await this.medicineCategoryService.findAll(query);
    return ApiResponse.success(
      categories,
      'Medicine categories retrieved successfully',
    );
  }
}
