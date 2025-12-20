import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Query,
  Param,
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
import { MedicineBatchService } from '../../medicine-batch/medicine-batch.service';
import {
  CreateMedicineBatchDto,
  QueryMedicineBatchDto,
  UpdateMedicineBatchDto,
} from '../../medicine-batch/dto';
import { ApiResponse, PaginatedResponse } from '../../common/dto';
import { UserRole } from '../../common/constants';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles } from '../../auth/decorators';

@ApiTags('Admin - Medicine Batch Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.DOCTOR)
@Controller('admin/medicine-batches')
export class AdminMedicineBatchController {
  constructor(private readonly medicineBatchService: MedicineBatchService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all medicine batches with pagination' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Medicine batches retrieved successfully',
  })
  async findAll(@Query() query: QueryMedicineBatchDto) {
    const result = await this.medicineBatchService.findAll(query);
    return PaginatedResponse.create(
      result.data,
      result.total,
      query,
      'Medicine batches retrieved successfully',
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo lô thuốc mới' })
  @ApiResponseSwagger({
    status: 201,
    description: 'Tạo lô thuốc thành công',
  })
  @ApiResponseSwagger({
    status: 404,
    description: 'Không tìm thấy thuốc',
  })
  @ApiResponseSwagger({
    status: 409,
    description: 'Số lô đã tồn tại cho thuốc này',
  })
  async create(@Body() dto: CreateMedicineBatchDto) {
    const medicineBatch = await this.medicineBatchService.create(dto);
    return ApiResponse.success(medicineBatch, 'Tạo lô thuốc thành công', 201);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy thông tin lô thuốc' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Lấy thông tin lô thuốc thành công',
  })
  async findOne(@Param('id') id: string) {
    const medicineBatch = await this.medicineBatchService.findOne(id);
    return ApiResponse.success(
      medicineBatch,
      'Lấy thông tin lô thuốc thành công',
    );
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cập nhật lô thuốc' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Cập nhật lô thuốc thành công',
  })
  @ApiResponseSwagger({
    status: 404,
    description: 'Không tìm thấy lô thuốc',
  })
  @ApiResponseSwagger({
    status: 409,
    description: 'Số lô đã tồn tại cho thuốc này',
  })
  async update(@Param('id') id: string, @Body() dto: UpdateMedicineBatchDto) {
    const medicineBatch = await this.medicineBatchService.update(id, dto);
    return ApiResponse.success(medicineBatch, 'Cập nhật lô thuốc thành công');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa mềm lô thuốc' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Xóa lô thuốc thành công',
  })
  @ApiResponseSwagger({
    status: 404,
    description: 'Không tìm thấy lô thuốc',
  })
  async softDelete(@Param('id') id: string) {
    await this.medicineBatchService.softDelete(id);
    return ApiResponse.success(null, 'Xóa lô thuốc thành công');
  }
}
