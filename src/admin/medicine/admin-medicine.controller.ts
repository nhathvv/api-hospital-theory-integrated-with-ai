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
import { MedicineService } from '../../medicine/medicine.service';
import { CreateMedicineDto, QueryMedicineDto } from '../../medicine/dto';
import { ApiResponse } from '../../common/dto';
import { UserRole } from '../../common/constants';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles } from '../../auth/decorators';

@ApiTags('Admin - Medicine Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/medicines')
export class AdminMedicineController {
  constructor(private readonly medicineService: MedicineService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo thuốc mới' })
  @ApiResponseSwagger({
    status: 201,
    description: 'Tạo thuốc thành công',
  })
  @ApiResponseSwagger({
    status: 409,
    description: 'Mã thuốc đã tồn tại',
  })
  @ApiResponseSwagger({
    status: 404,
    description: 'Không tìm thấy danh mục thuốc',
  })
  async create(@Body() dto: CreateMedicineDto) {
    const medicine = await this.medicineService.create(dto);
    return ApiResponse.success(medicine, 'Tạo thuốc thành công', 201);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách thuốc' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Lấy danh sách thuốc thành công',
  })
  async findAll(@Query() query: QueryMedicineDto) {
    const medicines = await this.medicineService.findAll(query);
    return ApiResponse.success(medicines, 'Lấy danh sách thuốc thành công');
  }
}
